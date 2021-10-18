import styled from 'styled-components';
import * as React from 'react';
import WebGLRenderer from './webgl-renderer';

export const App: React.FC<{}> = ({}) => {
  const ref = React.useRef<HTMLCanvasElement | null>(null);
  const renderer = React.useRef<WebGLRenderer | null>(null);
  const mouseDown = React.useRef<number>(0);

  const [width, setWidth] = React.useState(0);
  const [height, setHeight] = React.useState(0);
  const [grid, setGrid] = React.useState(true);
  const [tooltip, setTooltip] = React.useState(true);
  const [roots, setRoots] = React.useState(true);
  const [auto, setAuto] = React.useState(false);
  const [mouseX, setMouseX] = React.useState<{ px: number; data: number }>({
    px: 0,
    data: 0,
  });
  const [mouseY, setMouseY] = React.useState<{ px: number; data: number }>({
    px: 0,
    data: 0,
  });

  const upscaleTimeout = React.useRef<number | null>(null);
  const scheduleUpscale = React.useCallback(() => {
    if (upscaleTimeout.current) {
      clearTimeout(upscaleTimeout.current);
    }
    upscaleTimeout.current = window.setTimeout(() => {
      if (renderer.current) {
        renderer.current.assignUniformValue('nIter', 'int', 100);
        renderer.current.render();
      }
    }, 100);
  }, []);

  React.useEffect(() => {
    if (ref.current) {
      const bounds = ref.current.getBoundingClientRect();
      setWidth(bounds.width);
      setHeight(bounds.height);
      const r = new WebGLRenderer(ref.current);
      r.begin();
      renderer.current = r;
    }
  }, []);

  const onToggleGrid = React.useCallback(() => {
    if (renderer.current) {
      renderer.current.assignUniformValue('grid', 'float', grid ? 0 : 1);
      renderer.current.render();
      setGrid(g => !g);
    }
  }, [grid]);

  const onToggleRoots = React.useCallback(() => {
    if (renderer.current) {
      renderer.current.assignUniformValue('roots', 'float', roots ? 0 : 1);
      renderer.current.render();
      setRoots(r => !r);
    }
  }, [roots]);

  const onToggleAuto = React.useCallback(() => {
    if (renderer.current) {
      renderer.current.assignUniformValue('auto', 'float', auto ? 0 : 1);
      renderer.current.render(true);
      setAuto(g => !g);
    }
  }, [auto]);

  const onMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!renderer.current || !ref.current) {
        return;
      }
      const bounds = ref.current.getBoundingClientRect();
      const x = e.clientX - bounds.x;
      const y = e.clientY - bounds.y;
      const xLims = renderer.current.getUniformValue('xLims', 'vec2');
      const yLims = renderer.current.getUniformValue('yLims', 'vec2');
      const dataX = xLims[0] + (x / bounds.width) * (xLims[1] - xLims[0]);
      const dataY =
        yLims[0] +
        ((bounds.height - y) / bounds.height) * (yLims[1] - yLims[0]);
      setMouseX({ data: dataX, px: x });
      setMouseY({ data: dataY, px: y });
      if (mouseDown.current) {
        renderer.current.assignUniformValue(
          `root${mouseDown.current}`,
          'vec2',
          [dataX, dataY],
        );
        renderer.current.assignUniformValue('nIter', 'int', 20);
        renderer.current.render();
        scheduleUpscale();
      }
    },
    [],
  );

  const onMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!renderer.current || !ref.current) {
        return;
      }
      const resolution = renderer.current.getUniformValue('resolution', 'vec2');
      const root1 = renderer.current.getUniformValue('root1', 'vec2');
      const root2 = renderer.current.getUniformValue('root2', 'vec2');
      const root3 = renderer.current.getUniformValue('root3', 'vec2');
      const xLims = renderer.current.getUniformValue('xLims', 'vec2');
      const yLims = renderer.current.getUniformValue('yLims', 'vec2');

      const distPx = (root: [number, number]) => {
        const dataX = mouseX.data;
        const dataY = mouseY.data;
        const dxPx =
          ((dataX - root[0]) / (xLims[1] - xLims[0])) * resolution[0];
        const dyPx =
          ((dataY - root[1]) / (yLims[1] - yLims[0])) * resolution[1];
        return Math.sqrt(dxPx ** 2 + dyPx ** 2);
      };

      if (distPx(root1) < 20) {
        mouseDown.current = 1;
        return;
      }
      if (distPx(root2) < 20) {
        mouseDown.current = 2;
        return;
      }
      if (distPx(root3) < 20) {
        mouseDown.current = 3;
        return;
      }
    },
    [mouseX, mouseY],
  );

  const onMouseUp = React.useCallback(() => {
    mouseDown.current = 0;
  }, []);

  const onWheel = React.useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      if (!renderer.current) {
        return;
      }
      const deltaY = e.deltaY;
      const xLims = renderer.current.getUniformValue('xLims', 'vec2');
      const yLims = renderer.current.getUniformValue('yLims', 'vec2');
      const scale = 1 + deltaY / 1000;
      const w = xLims[1] - xLims[0];
      const h = yLims[1] - yLims[0];
      const newW = scale * w;
      const newH = scale * h;
      const newX0 = mouseX.data - scale * (mouseX.data - xLims[0]);
      const newY0 = mouseY.data - scale * (mouseY.data - yLims[0]);
      const newXlims: [number, number] = [newX0, newX0 + newW];
      const newYlims: [number, number] = [newY0, newY0 + newH];
      renderer.current.assignUniformValue('xLims', 'vec2', newXlims);
      renderer.current.assignUniformValue('yLims', 'vec2', newYlims);
      renderer.current.assignUniformValue('nIter', 'int', 20);
      renderer.current.render();
      scheduleUpscale();
    },
    [mouseX, mouseY],
  );

  return (
    <Outer>
      <canvas
        ref={ref}
        width={width * window.devicePixelRatio}
        height={height * window.devicePixelRatio}
        style={{
          ...{ display: 'flex', flex: 1 },
          ...(width && height ? { width, height } : {}),
        }}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
      ></canvas>
      {tooltip && (
        <Tooltip style={{ left: mouseX.px + 20, top: mouseY.px }}>
          {mouseX.data.toFixed(3)} {mouseY.data < 0 ? '-' : '+'}{' '}
          {Math.abs(mouseY.data).toFixed(3)}i
        </Tooltip>
      )}
      <Controls>
        <Checkbox checked={grid} onChange={onToggleGrid} title="Grid" />
        <Checkbox checked={roots} onChange={onToggleRoots} title="Roots" />
        <Checkbox
          checked={tooltip}
          onChange={() => setTooltip(t => !t)}
          title="Tooltip"
        />
        <Checkbox checked={auto} onChange={onToggleAuto} title="Auto" />
      </Controls>
    </Outer>
  );
};

const Checkbox: React.FC<{
  checked: boolean;
  title: string;
  onChange: () => void;
}> = ({ checked, title, onChange }) => {
  return (
    <CheckboxOuter onClick={onChange}>
      <input
        type="checkbox"
        checked={checked}
        style={{ marginRight: 5 }}
      ></input>
      <span>{title}</span>
    </CheckboxOuter>
  );
};

const Outer = styled.div`
  height: 100%;
  display: flex;
  font-family: system-ui;
  position: relative;
  flex: 1;
  overflow: hidden;
`;

const Tooltip = styled.div`
  font-family: monospace;
  position: absolute;
  pointer-events: none;
  background: black;
  color: white;
  border-radius: 3px;
  padding: 2px 4px;
`;

const Controls = styled.div`
  position: absolute;
  padding: 10px;
  padding-right: 15px;
  color: white;

  &:hover {
    background: rgba(0, 0, 0, 0.5);
  }
`;

const CheckboxOuter = styled.div`
  user-select: none;
  cursor: pointer;
  :not(:last-child) {
    margin-bottom: 10px;
  }
`;
