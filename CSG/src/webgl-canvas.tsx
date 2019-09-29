import * as React from "react";
import styled from "styled-components";
import WebGLRenderer from "./webgl";
import { Sphere, Primitive, Box } from "./primitives";
import { Callbacks3D } from "./app";

const Canvas = styled.canvas``;

interface WebGLCanvasProps {
  name: string;
  reportCallbacks: (callbacks: Callbacks3D) => void;
}

interface WebGLCanvasState {
  fps: number;
  rotating: boolean;
}

class WebGLCanvas extends React.Component<WebGLCanvasProps, WebGLCanvasState> {
  public readonly state: WebGLCanvasState = {
    fps: 0,
    rotating: false
  };

  private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  private webGLRenderer: WebGLRenderer | null = null;
  private lastMouseDown: { x: number; y: number } | null = null;

  public componentDidMount() {
    if (this.canvasRef.current) {
      this.webGLRenderer = new WebGLRenderer(fps => this.setState({ fps }));
      this.webGLRenderer.begin(this.canvasRef.current, {
        XY: boxes(),
        YZ: boxes(),
        XZ: boxes()
      });
      const XY = ((primitives: Primitive[]) => {
        if (this.webGLRenderer) {
          this.webGLRenderer.updateBoxesXY(primitives);
        }
      }).bind(this);
      const YZ = ((primitives: Primitive[]) => {
        if (this.webGLRenderer) {
          this.webGLRenderer.updateBoxesYZ(primitives);
        }
      }).bind(this);
      const XZ = ((primitives: Primitive[]) => {
        if (this.webGLRenderer) {
          this.webGLRenderer.updateBoxesXZ(primitives);
        }
      }).bind(this);
      this.props.reportCallbacks({ XY, YZ, XZ });
    }
  }

  private rotate() {
    if (!this.webGLRenderer || !this.state.rotating) {
      return;
    }
    requestAnimationFrame(() => {
      this.webGLRenderer!.updateRotation({ x: 0.02, y: 0.04 });
      this.rotate();
    });
  }

  public render() {
    const { fps } = this.state;
    return (
      <>
        <div style={{ userSelect: "none" }}>{Math.round(fps)}</div>
        <button
          onClick={() => {
            this.setState({ rotating: !this.state.rotating });
            requestAnimationFrame(() => this.rotate());
          }}
        >
          Toggle rotation
        </button>
        <button onClick={() => this.webGLRenderer!.setRotation({ x: 0, y: 0 })}>
          Reset rotation
        </button>
        <Canvas
          ref={this.canvasRef}
          width={512}
          height={512}
          onMouseDown={e => this.handleMouseDown(e)}
          onMouseUp={e => this.handleMouseUp()}
          onMouseMove={e => this.handleMouseMove(e)}
          onWheel={e => this.handleWheel(e)}
        />
      </>
    );
  }

  private handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    if (!this.webGLRenderer) {
      return;
    }
    const dl = e.deltaY / 1000;
    this.webGLRenderer.updateZoom(dl);
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  private handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!this.lastMouseDown || !this.webGLRenderer) {
      return;
    }
    const { clientX, clientY } = e;
    const deltaY = 0.01 * (clientX - this.lastMouseDown.x);
    const deltaX = 0.01 * (clientY - this.lastMouseDown.y);
    this.webGLRenderer.updateRotation({ x: deltaX, y: deltaY });
    this.lastMouseDown = { x: clientX, y: clientY };
  }

  private handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const { clientX, clientY } = e;
    this.lastMouseDown = { x: clientX, y: clientY };
  }

  private handleMouseUp() {
    this.lastMouseDown = null;
  }
}

export default WebGLCanvas;

const boxes = (): Box[] => {
  const N = 500;
  return new Array(N).fill(0).map((_, i) => {
    const x = i / N - 0.5;
    const y = i / N - 0.5;
    const w = 0.1;
    const h = 0.1;
    return { x, y, w, h, type: "box" };
  });
};
