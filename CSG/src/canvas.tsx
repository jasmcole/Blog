import * as React from "react";
import styled from "styled-components";
import qtree, { Rect } from "./qtree";
import { SetPrimitives } from "./app";

const Canvas = styled.canvas`
  border: 1px solid red;
`;

interface CanvasProps {
  width: number;
  height: number;
  callback: SetPrimitives | null;
}

interface CanvasState {
  mouseDown: boolean;
}

class DrawableCanvas extends React.Component<CanvasProps, CanvasState> {
  public readonly state: CanvasState = {
    mouseDown: false
  };

  private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  private canvasContext: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private rects: Array<Rect> | null = null;

  public componentDidMount() {
    if (this.canvasRef.current) {
      this.canvasContext = this.canvasRef.current.getContext("2d");
      if (!this.canvasContext) {
        throw new Error("Failed to get 2D context");
      }
      this.imageData = this.canvasContext.createImageData(
        this.props.width,
        this.props.height
      );
      this.canvasContext.putImageData(this.imageData, 0, 0);
    }
  }

  public render() {
    const { width, height } = this.props;
    return (
      <>
        <div>{this.rects ? this.rects.length : 0}</div>
        <Canvas
          ref={this.canvasRef}
          width={width}
          height={height}
          onMouseDown={e => this.handleMouseDown(e)}
          onMouseUp={e => this.handleMouseUp()}
          onMouseMove={e => this.handleMouseMove(e)}
        />
      </>
    );
  }

  private detRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  private paintQTree() {
    if (!this.imageData || !this.canvasContext) {
      return;
    }
    console.time();
    const rects = qtree(this.imageData);
    console.timeEnd();
    console.log(rects.length);
    rects.forEach((rect, i) => {
      const r = Math.round(255 * this.detRandom(rect.left * (rect.top + 1)));
      const g = Math.round(255 * this.detRandom(rect.top * (rect.bottom + 1)));
      const b = Math.round(255 * this.detRandom(rect.left / rect.top));
      const { left, right, top, bottom } = rect;
      const { data } = this.imageData!;
      for (let x = left; x <= right; x++) {
        for (let y = top; y <= bottom; y++) {
          const ind = 4 * (y * this.props.width + x);
          data[ind + 0] = r;
          data[ind + 1] = g;
          data[ind + 2] = b;
          data[ind + 3] = 255;
        }
      }
    });
    this.canvasContext.putImageData(this.imageData, 0, 0);
  }

  private paintQTreeEdges() {
    if (!this.imageData || !this.canvasContext) {
      return;
    }
    console.time();
    this.rects = qtree(this.imageData);
    console.timeEnd();
    console.log(this.rects.length);
    this.rects.forEach((rect, i) => {
      const { left, right, top, bottom } = rect;
      const { data } = this.imageData!;

      for (let x = left; x <= right; x++) {
        for (let y = top; y <= bottom; y++) {
          const ind = 4 * (y * this.props.width + x);
          data[ind + 0] = 0;
          data[ind + 1] = 0;
          data[ind + 2] = 0;
          data[ind + 3] = 255;
        }
      }

      for (let x = left; x <= right; x++) {
        const indTop = 4 * (top * this.props.width + x);
        const indBot = 4 * (bottom * this.props.width + x);
        data[indTop + 0] = 128;
        data[indTop + 1] = 128;
        data[indTop + 2] = 128;
        data[indTop + 3] = 255;

        data[indBot + 0] = 128;
        data[indBot + 1] = 128;
        data[indBot + 2] = 128;
        data[indBot + 3] = 255;
      }

      for (let y = top; y <= bottom; y++) {
        const indTop = 4 * (y * this.props.width + left);
        const indBot = 4 * (y * this.props.width + right);
        data[indTop + 0] = 128;
        data[indTop + 1] = 128;
        data[indTop + 2] = 128;
        data[indTop + 3] = 255;

        data[indBot + 0] = 128;
        data[indBot + 1] = 128;
        data[indBot + 2] = 128;
        data[indBot + 3] = 255;
      }
    });
    this.canvasContext.putImageData(this.imageData, 0, 0);
  }

  private handleMouseUp() {
    if (this.state.mouseDown) {
      this.setState({ mouseDown: false });
    }
    this.paintQTreeEdges();
    this.updateWebGL();
  }

  private updateWebGL() {
    if (this.props.callback && this.rects) {
      this.props.callback(
        this.rects.map(rect => ({
          type: "box",
          x: 2 * ((0.5 * (rect.left + rect.right)) / this.props.width - 0.5),
          y:
            2 *
            (1 - (0.5 * (rect.top + rect.bottom)) / this.props.height - 0.5),
          z: 0,
          w: (rect.right - rect.left) / this.props.width,
          h: (rect.bottom - rect.top) / this.props.height
        }))
      );
    }
  }

  private handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!this.state.mouseDown) {
      return;
    }
    const [x, y] = this.getImageCoords(e);
    this.paint(x, y);
    this.paintQTreeEdges();
    // this.updateWebGL();
  }

  private getImageCoords(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!this.canvasRef.current) {
      return [0, 0];
    }
    const { left, top } = this.canvasRef.current.getBoundingClientRect();
    const [x, y] = [e.clientX - left, e.clientY - top];
    return [x, y];
  }

  private handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!this.state.mouseDown) {
      this.setState({ mouseDown: true });
    }
    const [x, y] = this.getImageCoords(e);
    this.paint(x, y);
  }

  private paint(x: number, y: number) {
    if (!this.imageData || !this.canvasContext) {
      return;
    }
    const { data } = this.imageData;

    const r = 30;
    const r2 = r ** 2;
    const iMin = Math.max(
      0,
      4 * Math.floor((y - r) * this.props.width + (x - r))
    );
    const iMax = Math.min(
      data.length,
      4 * Math.ceil((y + r) * this.props.width + (x + r))
    );

    for (let i = iMin; i < iMax; i += 4) {
      const yInd = Math.floor(i / 4 / this.props.width);
      const xInd = i / 4 - yInd * this.props.width;

      const d2 = (xInd - x) ** 2 + (yInd - y) ** 2;
      if (d2 < r2) {
        data[i + 0] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
    }
    this.canvasContext.putImageData(this.imageData, 0, 0);
  }
}

export default DrawableCanvas;
