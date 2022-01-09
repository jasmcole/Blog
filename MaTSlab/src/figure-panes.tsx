import * as React from 'react';
import styled from 'styled-components';
import { Figure } from './figure';
import { Col, Row, RowHV, RowV, theme } from './style';
import { Figs } from './use-figs';

const height100: React.CSSProperties = { height: '100%' };

interface Common {
  onDrag: (
    dx: number,
    dy: number,
    indicies: number[],
    parentWidth: number,
    parentHeight: number,
    direction: 'h' | 'v',
  ) => void;
  onDragTabStart: (figNum: number, indices: number[]) => void;
  onDragTabEnd: (figNum: number) => void;
  onDragTabOver: (figNum: number, indices: number[]) => void;
  onClose: (indices: number[]) => void;
  onSplit: (indices: number[], direction: 'h' | 'v') => void;
  onAddFig: (indices: number[]) => void;
  onSetActive: (indices: number[], active: number) => void;
  figs: Figs;
  dragTab: {
    figNum: number;
    indices: number[];
  } | null;
}

type LeafPane = { figNums: number[]; active: number | null };
type PaneArray = Array<{ frac: number; pane: Panes }>;

export interface Panes {
  split: 'v' | 'h';
  panes: LeafPane | PaneArray;
}

type PanesWithLeaf = Pick<Panes, 'split'> & { panes: LeafPane };

export const FigurePanes = (props: {
  figs: Figs;
  panes: Panes;
  addFig: () => number;
  removeFig: (figNum: number) => void;
  onPanesChange: (panes: Panes) => void;
}) => {
  const [dragTab, setDragTab] = React.useState<{
    figNum: number;
    indices: number[];
  } | null>(null);
  const [dragOver, setDragOver] = React.useState<number[] | null>(null);

  const onDrag = (
    x: number,
    y: number,
    indices: number[],
    w: number,
    h: number,
    direction: 'h' | 'v',
  ) => {
    const thisIndices = [...indices];
    let p = props.panes;
    const deltaFrac = direction === 'h' ? x / w : y / h;
    const lastIndex = thisIndices.pop()!;
    for (const index of thisIndices) {
      if (!Array.isArray(p.panes)) {
        throw new Error(`Unexpected lack of Array`);
      }
      p = p.panes[index].pane;
    }
    if (!Array.isArray(p.panes)) {
      throw new Error(`Unexpected lack of Array`);
    }
    const oldFrac = p.panes[lastIndex].frac;
    let newFrac = oldFrac + deltaFrac;
    if (newFrac < 0.1) {
      newFrac = 0.1;
    }
    if (newFrac > 0.9) {
      newFrac = 0.9;
    }
    p.panes[lastIndex] = { ...p.panes[lastIndex], frac: newFrac };
    const remainingFrac = p.panes
      .slice(lastIndex + 1)
      .reduce((acc, curr) => acc + curr.frac, 0);
    const newRemainingFrac = remainingFrac - (newFrac - oldFrac);
    const fraction = newRemainingFrac / remainingFrac;
    for (let i = lastIndex + 1; i < p.panes.length; i++) {
      p.panes[i] = { ...p.panes[i], frac: p.panes[i].frac * fraction };
    }

    props.onPanesChange({ ...props.panes });
  };

  const onClose = (indices: number[]) => {
    const thisIndices = [...indices];
    let p = props.panes;
    let parent: Panes | null = null;
    for (const index of thisIndices) {
      if (!Array.isArray(p.panes)) {
        throw new Error(`Unexpected lack of Array`);
      }
      parent = p;
      p = p.panes[index].pane;
    }

    if (Array.isArray(p.panes)) {
      throw new Error(`Unexpected Array`);
    }
    const { active } = p.panes;

    const lastPane =
      p.panes.figNums.length > 0
        ? p.panes.figNums[p.panes.figNums.length - 1]
        : null;
    const focusAfter =
      p.panes.figNums.length > 1
        ? p.panes.figNums[p.panes.figNums.length - 2]
        : null;
    const toRemove = active ?? lastPane;

    if (p.panes.figNums.length > 0) {
      // Close a figure
      p.panes.figNums = p.panes.figNums.filter(num => num !== toRemove);
      p.panes.active = focusAfter;
    } else {
      // Close a pane
      if (parent && Array.isArray(parent.panes)) {
        parent.panes = parent.panes.filter(
          (_, i) => i !== indices[indices.length - 1],
        );
      }
    }

    const oldPanes = { ...props.panes };
    const newPanes = chain([
      removeSingle,
      ensureRoot,
      ensureFill,
      filterAllEmpty,
    ])(oldPanes);

    props.onPanesChange(newPanes);
    if (toRemove !== null) {
      props.removeFig(toRemove);
    }
  };

  const onSplit = (indices: number[], direction: 'h' | 'v') => {
    const thisIndices = [...indices];
    let p = props.panes;
    for (const index of thisIndices) {
      if (!Array.isArray(p.panes)) {
        throw new Error(`Unexpected lack of Array`);
      }
      p = p.panes[index].pane;
    }
    if (Array.isArray(p.panes)) {
      throw new Error('Unexpected Array');
    }
    const pane = p.panes;
    p.split = direction;
    p.panes = [
      { frac: 0.5, pane: { split: direction, panes: pane } },
      {
        frac: 0.5,
        pane: { split: direction, panes: { figNums: [], active: null } },
      },
    ];
    props.onPanesChange(chain([removeSingle, ensureFill])(props.panes));
  };

  const getLeaf = (indices: number[]): PanesWithLeaf => {
    const thisIndices = [...indices];
    let p = props.panes;
    for (const index of thisIndices) {
      if (!Array.isArray(p.panes)) {
        throw new Error(`Unexpected lack of Array`);
      }
      p = p.panes[index].pane;
    }
    if (Array.isArray(p.panes)) {
      throw new Error('Unexpected Array');
    }
    return p as PanesWithLeaf;
  };

  const onAddFig = (indices: number[]) => {
    const leaf = getLeaf(indices);
    const newFigNum = props.addFig();
    leaf.panes = {
      figNums: [...leaf.panes.figNums, newFigNum],
      active: newFigNum,
    };
    props.onPanesChange(chain([removeSingle, ensureFill])(props.panes));
  };

  const onSetActive = (indices: number[], active: number) => {
    const leaf = getLeaf(indices);
    if (!leaf.panes.figNums.includes(active)) {
      return;
    }
    leaf.panes.active = active;
    props.onPanesChange(chain([removeSingle, ensureFill])(props.panes));
  };

  const onDragTabStart = (figNum: number, indices: number[]) => {
    setDragTab({ figNum, indices });
    setDragOver(null);
  };
  const onDragTabEnd = (figNum: number) => {
    if (dragOver && dragTab) {
      // TODO - swap names!
      const source = getLeaf(dragOver);
      const target = getLeaf(dragTab.indices);
      if (!source.panes.figNums.includes(figNum)) {
        source.panes.figNums.push(figNum);
        source.panes.active = figNum;
        target.panes.figNums = target.panes.figNums.filter(f => f !== figNum);
        if (target.panes.active === figNum) {
          target.panes.active =
            target.panes.figNums[target.panes.figNums.length - 1] ?? null;
        }
        props.onPanesChange(chain([removeSingle, ensureFill])(props.panes));
      }
    }
    setDragTab(null);
    setDragOver(null);
  };
  const onDragTabOver = (figNum: number, indices: number[]) => {
    setDragOver(indices);
  };

  // If figs are created, ensure they have a home here
  React.useEffect(() => {
    const figNums: number[] = [];
    enumerateFigs(props.panes, figNums);
    const leaf = findFirstLeaf(props.panes);
    let didInsert = false;
    for (const fig of props.figs) {
      if (!figNums.includes(fig.figNum)) {
        leaf.figNums.push(fig.figNum);
        leaf.active = fig.figNum;
        didInsert = true;
      }
    }
    if (didInsert) {
      props.onPanesChange(chain([removeSingle, ensureFill])(props.panes));
    }
  }, [props.figs, props.panes]);

  const common = {
    figs: props.figs,
    dragTab,
    onDrag,
    onClose,
    onSplit,
    onAddFig,
    onSetActive,
    onDragTabStart,
    onDragTabEnd,
    onDragTabOver,
  };

  return <Pane panes={props.panes} indices={[]} common={common} />;
};

const Pane = ({
  panes,
  indices,
  common,
}: {
  panes: Panes;
  indices: number[];
  common: Common;
}) =>
  Array.isArray(panes.panes) ? (
    panes.split === 'v' ? (
      <VSplit panes={panes.panes} indices={indices} common={common} />
    ) : (
      <HSplit panes={panes.panes} indices={indices} common={common} />
    )
  ) : (
    <Leaf
      figNums={panes.panes.figNums}
      active={panes.panes.active}
      indices={indices}
      common={common}
    />
  );

const VSplitPaneOuter = styled.div<{ flex: number }>`
  height: ${p => p.flex * 100}%;
  width: 100%;
  position: relative;
  user-select: none;
  /* transition: 100ms ease-out; */
  :not(:last-child) {
    border-bottom: 1px solid black;
  }
`;

const HSplitPaneOuter = styled.div<{ flex: number }>`
  width: ${p => p.flex * 100}%;
  height: 100%;
  position: relative;
  user-select: none;
  /* transition: 100ms ease-out; */
  :not(:last-child) {
    border-right: 1px solid black;
  }
`;

const HSplitDivider = styled.div<{ dx: number }>`
  position: absolute;
  right: -2.5px;
  width: 5px;
  height: 100%;
  top: 0;
  cursor: ew-resize;
  z-index: 1;
  background: ${p => (p.dx !== 0 ? theme.primary : 'transparent')};

  &:hover {
    background: ${theme.primary};
  }
`;

const VSplitDivider = styled.div<{ dy: number }>`
  position: absolute;
  bottom: -2.5px;
  height: 5px;
  width: 100%;
  left: 0;
  cursor: ns-resize;
  z-index: 1;
  background: ${p => (p.dy !== 0 ? theme.primary : 'transparent')};

  &:hover {
    background: ${theme.primary};
  }
`;

const HSplit = (props: {
  panes: Array<{ frac: number; pane: Panes }>;
  indices: number[];
  common: Common;
}) => {
  const [parentRef, setParentRef] = React.useState<HTMLDivElement | null>(null);
  return (
    <Row style={height100} ref={setParentRef}>
      {props.panes.map((pane, i) => (
        <HSplitPane
          key={i}
          pane={pane}
          i={i}
          indices={props.indices}
          parentRef={parentRef}
          isLast={i === props.panes.length - 1}
          common={props.common}
        />
      ))}
    </Row>
  );
};

const HSplitPane = (props: {
  pane: { frac: number; pane: Panes };
  indices: number[];
  i: number;
  parentRef: HTMLDivElement | null;
  isLast: boolean;
  common: Common;
}) => {
  const myIndices = React.useMemo(() => [...props.indices, props.i], [
    props.indices,
    props.i,
  ]);
  const { onMouseDown, mouseDown } = useDrag(
    props.common.onDrag,
    myIndices,
    props.parentRef,
    'h',
  );

  return (
    <HSplitPaneOuter flex={props.pane.frac} key={props.pane.frac}>
      <Pane panes={props.pane.pane} indices={myIndices} common={props.common} />
      {props.isLast ? null : (
        <HSplitDivider
          onMouseDown={onMouseDown}
          dx={mouseDown?.dx ?? 0}
          style={{ transform: `translateX(${mouseDown?.dx ?? 0}px)` }}
          title="Drag to resize"
        />
      )}
    </HSplitPaneOuter>
  );
};

const VSplit = (props: {
  panes: Array<{ frac: number; pane: Panes }>;
  indices: number[];
  common: Common;
}) => {
  const [parentRef, setParentRef] = React.useState<HTMLDivElement | null>(null);
  return (
    <Col style={height100} ref={setParentRef}>
      {props.panes.map((pane, i) => (
        <VSplitPane
          key={i}
          pane={pane}
          i={i}
          indices={props.indices}
          parentRef={parentRef}
          isLast={i === props.panes.length - 1}
          common={props.common}
        />
      ))}
    </Col>
  );
};

const VSplitPane = (props: {
  pane: { frac: number; pane: Panes };
  indices: number[];
  i: number;
  parentRef: HTMLDivElement | null;
  isLast: boolean;
  common: Common;
}) => {
  const myIndices = React.useMemo(() => [...props.indices, props.i], [
    props.indices,
    props.i,
  ]);
  const { onMouseDown, mouseDown } = useDrag(
    props.common.onDrag,
    myIndices,
    props.parentRef,
    'v',
  );

  return (
    <VSplitPaneOuter flex={props.pane.frac} key={props.pane.frac}>
      <Pane panes={props.pane.pane} indices={myIndices} common={props.common} />
      {props.isLast ? null : (
        <VSplitDivider
          onMouseDown={onMouseDown}
          dy={mouseDown?.dy ?? 0}
          style={{ transform: `translateY(${mouseDown?.dy ?? 0}px)` }}
          title="Drag to resize"
        />
      )}
    </VSplitPaneOuter>
  );
};

const Split = styled.div`
  padding: 0 5px;
  user-select: none;
  cursor: pointer;
  &:hover {
    color: ${theme.primary};
  }
`;

const Leaf = (props: {
  figNums: number[];
  active: number | null;
  indices: number[];
  common: Common;
}) => {
  const activeFig = props.active
    ? props.common.figs.find(f => f.figNum === props.active)
    : null;

  const [ref, setRef] = React.useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (
      props.common.dragTab !== null &&
      props.figNums.includes(props.common.dragTab.figNum)
    ) {
      const onMouseUp = () =>
        props.common.onDragTabEnd(props.common.dragTab!.figNum);
      window.addEventListener('mouseup', onMouseUp);
      return () => window.removeEventListener('mouseup', onMouseUp);
    }
  }, [props.common.dragTab, props.figNums, props.common.onDragTabEnd]);

  React.useEffect(() => {
    if (props.common.dragTab !== null && ref) {
      const onMouseEnter = () => {
        props.common.onDragTabOver(props.common.dragTab!.figNum, props.indices);
      };
      ref.addEventListener('mouseenter', onMouseEnter);
      return () => ref.removeEventListener('mouseenter', onMouseEnter);
    }
  }, [props.common.dragTab, ref, props.indices, props.common.onDragTabOver]);

  return (
    <Col
      ref={setRef}
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <FigTabs dragging={props.common.dragTab !== null}>
        {props.figNums.map(figNum => (
          <FigTabTitle
            key={figNum}
            active={figNum === props.active}
            onClick={() => props.common.onSetActive(props.indices, figNum)}
            onMouseDown={() =>
              props.common.onDragTabStart(figNum, props.indices)
            }
          >
            {figNum}
          </FigTabTitle>
        ))}
        <Split
          style={{ paddingLeft: 8 }}
          title="Add figure"
          onClick={() => props.common.onAddFig(props.indices)}
        >
          +
        </Split>
        <Split
          style={{ paddingTop: 2, marginLeft: 'auto' }}
          onClick={() => props.common.onSplit(props.indices, 'v')}
          title="Split vertically"
        >
          ⇅
        </Split>
        <Split
          style={{ paddingTop: 2 }}
          onClick={() => props.common.onSplit(props.indices, 'h')}
          title="Split horizontally"
        >
          ⇆
        </Split>
        <Split
          style={{ paddingLeft: 8, paddingRight: 10 }}
          onClick={() => props.common.onClose(props.indices)}
          title="Close"
        >
          ×
        </Split>
      </FigTabs>
      <FigWindow dragging={props.common.dragTab !== null}>
        {activeFig && <Figure {...activeFig} key={activeFig.figNum} />}
      </FigWindow>
    </Col>
  );
};

const FigWindow = styled(RowHV)<{ dragging: boolean }>`
  flex-grow: 1;
  height: 100%;
  width: 100%;

  &:hover {
    background: ${p => (p.dragging ? theme.primary : '')};
  }
`;

const FigTabs = styled(RowV)<{ dragging: boolean }>`
  border-bottom: 1px solid ${theme.darkGrey};
  height: 30px;
  max-height: 29px;
  min-height: 29px;
  background: ${theme.veryLightGrey};
  overflow: hidden;

  /* &:hover {
    background: ${p => (p.dragging ? theme.primary : '')};
  } */
`;

const FigTabTitle = styled.div<{ active: boolean }>`
  margin: 5px 0px;
  padding: 0px 8px;
  font-family: sans-serif;
  border-right: 1px solid ${theme.darkGrey};
  background: ${p => (p.active ? theme.primary : 'transparent')};
  color: ${p => (p.active ? 'white' : 'black')};
  height: 100%;
  user-select: none;
  cursor: pointer;
  padding-top: 12px;

  &:hover {
    ${p => (p.active ? '' : `background: ${theme.lightGrey};`)}
  }
`;

const useDrag = (
  onDrag: Common['onDrag'],
  indices: number[],
  parentRef: HTMLDivElement | null,
  direction: 'h' | 'v',
) => {
  const [mouseDown, setMouseDown] = React.useState<null | {
    x: number;
    y: number;
    dx: number;
    dy: number;
  }>(null);

  const onMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setMouseDown({ x: e.clientX, y: e.clientY, dx: 0, dy: 0 });
    },
    [],
  );

  React.useEffect(() => {
    if (!mouseDown || !parentRef) {
      return;
    }
    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - mouseDown.x;
      const deltaY = e.clientY - mouseDown.y;
      setMouseDown({ ...mouseDown, dx: deltaX, dy: deltaY });
    };

    const onMouseUp = (e: MouseEvent) => {
      const deltaX = e.clientX - mouseDown.x;
      const deltaY = e.clientY - mouseDown.y;
      const rect = parentRef.getBoundingClientRect();
      onDrag(deltaX, deltaY, indices, rect.width, rect.height, direction);
      setMouseDown(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [mouseDown, parentRef]);

  return { onMouseDown, mouseDown };
};

const chain = (funcs: Array<(p: Panes) => Panes>): ((p: Panes) => Panes) => (
  p: Panes,
) => funcs.reduce((acc, curr) => curr(acc), p);

const removeSingle = (p: Panes): Panes => {
  if (Array.isArray(p.panes)) {
    p.panes = p.panes.map(({ frac, pane }) => ({
      frac,
      pane: removeSingle(pane),
    }));
    if (p.panes.length === 1) {
      return p.panes[0].pane;
    }
  }
  return p;
};

// Panes has no children
const isEmpty = (p: Panes): boolean =>
  Array.isArray(p.panes) && p.panes.length === 0;

// One level of filtering
const filterEmpty = (p: Panes): Panes =>
  Array.isArray(p.panes)
    ? { ...p, panes: p.panes.filter(({ pane }) => !isEmpty(pane)) }
    : p;

const filterAllEmpty = (p: Panes): Panes => {
  const thisP = filterEmpty(p);

  if (Array.isArray(thisP.panes)) {
    p.panes = thisP.panes.map(({ pane, frac }) => ({
      pane: filterAllEmpty(pane),
      frac,
    }));
  }

  return thisP;
};

const ensureFill = (p: Panes): Panes => {
  if (Array.isArray(p.panes)) {
    const totalFrac = p.panes.reduce((acc, curr) => acc + curr.frac, 0);
    p.panes = p.panes.map(({ frac, pane }) => ({
      frac: frac / totalFrac,
      pane,
    }));
    for (const { pane } of p.panes) {
      ensureFill(pane);
    }
  }
  return { ...p };
};

const ensureRoot = (p: Panes): Panes => {
  if (Array.isArray(p.panes) && p.panes.length === 0) {
    p.panes = { figNums: [], active: null };
  }
  return { ...p };
};

const enumerateFigs = (p: Panes, accumulator: number[]) => {
  if (Array.isArray(p.panes)) {
    for (const { pane } of p.panes) {
      enumerateFigs(pane, accumulator);
    }
  } else {
    accumulator.push(...p.panes.figNums);
  }
};

const findFirstLeaf = (p: Panes): LeafPane => {
  if (Array.isArray(p.panes)) {
    return findFirstLeaf(p.panes[0].pane);
  }
  return p.panes;
};
