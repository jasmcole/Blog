import * as React from "react";
import styled from "styled-components";
import WebGLRenderer from "./webgl";

const Canvas = styled.canvas``;

export type CircleCallback = (
  circles: Array<{ x: number; y: number; r: number }>
) => void;

interface WebGLCanvasProps {
  name: string;
  reportUpdate: (callback: CircleCallback) => void;
}

class WebGLCanvas extends React.Component<WebGLCanvasProps> {
  private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  private webGLRenderer: WebGLRenderer | null = null;

  public componentDidMount() {
    if (this.canvasRef.current) {
      this.webGLRenderer = new WebGLRenderer();
      this.webGLRenderer.begin(this.canvasRef.current, circles());
      const callback = (
        circles: Array<{ x: number; y: number; r: number }>
      ) => {
        if (this.webGLRenderer) {
          this.webGLRenderer.updateCircles(circles);
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

const circles = () =>
  new Array(10000).fill(0).map(() => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.005 * Math.random()
  }));
