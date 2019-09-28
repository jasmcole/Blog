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

class WebGLCanvas extends React.Component<WebGLCanvasProps> {
  private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  private webGLRenderer: WebGLRenderer | null = null;

  public componentDidMount() {
    if (this.canvasRef.current) {
      this.webGLRenderer = new WebGLRenderer();
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
    return <Canvas ref={this.canvasRef} width={512} height={512} />;
  }
}

export default WebGLCanvas;

// const circles = () =>
//   new Array(10000).fill(0).map(() => ({
//     x: Math.random(),
//     y: Math.random(),
//     r: 0.005 * Math.random()
//   }));

const spheres = (): Sphere[] => [
  { x: -1, y: -1, z: 0, r: 0.5, type: "sphere" },
  { x: 1, y: 1, z: 0, r: 0.2, type: "sphere" }
];
