import * as React from "react";
import styled from "styled-components";
import WebGLRenderer from "./webgl";
import { Sphere, Primitive } from "./primitives";

const Canvas = styled.canvas``;

export type SetPrimitives = (primitives: Primitive[]) => void;

interface WebGLCanvasProps {
  name: string;
  reportUpdate: (callback: SetPrimitives) => void;
}

interface WebGLCanvasState {
  fps: number;
}

class WebGLCanvas extends React.Component<WebGLCanvasProps, WebGLCanvasState> {
  public readonly state: WebGLCanvasState = {
    fps: 0
  };

  private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  private webGLRenderer: WebGLRenderer | null = null;
  private lastMouseDown: { x: number; y: number } | null = null;

  public componentDidMount() {
    if (this.canvasRef.current) {
      this.webGLRenderer = new WebGLRenderer(fps => this.setState({ fps }));
      this.webGLRenderer.begin(this.canvasRef.current, spheres());
      const callback = (primitives: Primitive[]) => {
        if (this.webGLRenderer) {
          this.webGLRenderer.updateCircles(primitives);
        }
      };
      this.props.reportUpdate(callback.bind(this));
    }
  }

  public render() {
    const { fps } = this.state;
    return (
      <>
        <div style={{ userSelect: "none" }}>{Math.round(fps)}</div>
        <Canvas
          ref={this.canvasRef}
          width={512}
          height={512}
          onMouseDown={e => this.handleMouseDown(e)}
          onMouseUp={e => this.handleMouseUp()}
          onMouseMove={e => this.handleMouseMove(e)}
        />
      </>
    );
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

const spheres = (): Sphere[] => [
  { x: -0.5, y: -0.5, z: 0, r: 0.5, type: "sphere" },
  { x: 0.5, y: 0.5, z: 0, r: 0.2, type: "sphere" }
];
