import * as React from "react";
import styled from "styled-components";
import qtree, { Rect } from "./qtree";
import { SetPrimitives } from "./app";

export const Canvas = styled.canvas`
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 5px;
`;

export const Title = styled.div`
  font-size: 18px;
  font-weight: 600;
  font-family: sans-serif;
  margin-bottom: 10px;
  text-align: left;
  margin-left: 10px;
  user-select: none;
`;

export const Button = styled.button`
  font-size: 14px;
  padding: 4px 8px;
  margin: 5px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  cursor: pointer;
  user-select: none;
  transition: 200ms ease-out;
  font-family: sans-serif;
  &:hover {
    box-shadow: 0px 2px 4px 2px rgba(0, 0, 0, 0.1);
  }
`;

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 10px;
`;

export const Row = styled.div`
  display: flex;
`;

const Hover = styled.div<{ painting: boolean }>`
  position: absolute;
  border-radius: 50%;
  background: ${p => (p.painting ? "rgba(0,0,0,0.2)" : "none")};
  border: ${p => (p.painting ? "none" : "1px solid red")};
  pointer-events: none;
  transform: width 200ms height 200ms;
}}

`;

interface CanvasProps {
  width: number;
  height: number;
  title: string;
  callback: SetPrimitives | null;
}

interface CanvasState {
  mouseDown: boolean;
  hoverCoords: { x: number; y: number } | null;
  radius: number;
  minSize: number;
  painting: boolean; // False for erasing
}

class DrawableCanvas extends React.Component<CanvasProps, CanvasState> {
  public readonly state: CanvasState = {
    hoverCoords: null,
    mouseDown: false,
    radius: 30,
    minSize: 16,
    painting: true
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
      this.paint(this.props.width / 2, this.props.height / 2, [0, 0, 0, 255]);
      this.paintQTreeEdges(this.state.minSize);
      setTimeout(() => this.updateWebGL(), 500);
    }
  }

  private increaseDetail() {
    const { minSize } = this.state;
    if (minSize > 2) {
      const newMinSize = minSize / 2;
      this.paintQTreeEdges(newMinSize);
      this.updateWebGL();
      this.setState({ minSize: newMinSize });
    }
  }

  private decreaseDetail() {
    const { minSize } = this.state;
    if (minSize < Math.min(this.props.width, this.props.height) / 2) {
      const newMinSize = minSize * 2;
      this.paintQTreeEdges(newMinSize);
      this.updateWebGL();
      this.setState({ minSize: newMinSize });
    }
  }

  public render() {
    const { width, height, title } = this.props;
    const { hoverCoords, radius, painting } = this.state;
    return (
      <Row>
        <Column>
          <Title>{title}</Title>
          <Row>
            <Column>
              <Button onClick={() => this.setState({ painting: !painting })}>
                Toggle paint/erase
              </Button>
              <Button onClick={() => this.increaseDetail()}>
                Increase detail (slower)
              </Button>
              <Button onClick={() => this.decreaseDetail()}>
                Decrease detail (faster)
              </Button>
            </Column>
            <Column>
              <div style={{ position: "relative" }}>
                {hoverCoords && (
                  <Hover
                    painting={painting}
                    style={{
                      left: hoverCoords.x - radius,
                      top: hoverCoords.y - radius,
                      width: 2 * radius + 2,
                      height: 2 * radius + 2
                    }}
                  />
                )}
                <Canvas
                  ref={this.canvasRef}
                  width={width}
                  height={height}
                  onMouseDown={e => this.handleMouseDown(e)}
                  onMouseUp={e => this.handleMouseUp()}
                  onMouseMove={e => this.handleMouseMove(e)}
                  onMouseLeave={e => this.setState({ hoverCoords: null })}
                  onWheel={e =>
                    this.setState({
                      radius: this.state.radius * (1 + e.deltaY / 1000)
                    })
                  }
                />
              </div>
            </Column>
          </Row>
        </Column>
      </Row>
    );
  }

  private paintQTreeEdges(minSize: number) {
    if (!this.imageData || !this.canvasContext) {
      return;
    }

    const { data } = this.imageData!;

    for (let x = 0; x < this.props.width; x++) {
      for (let y = 0; y < this.props.height; y++) {
        const ind = 4 * (y * this.props.width + x);
        if (data[ind + 3] === 255) {
          data[ind + 0] = 0;
          data[ind + 1] = 0;
          data[ind + 2] = 0;
        }
      }
    }

    this.rects = qtree(this.imageData, minSize);
    this.rects.forEach((rect, i) => {
      const { left, right, top, bottom } = rect;

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
    this.paintQTreeEdges(this.state.minSize);
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
    const [x, y] = this.getImageCoords(e);
    this.setState({ hoverCoords: { x, y } });
    if (!this.state.mouseDown) {
      return;
    }
    const color = this.state.painting ? [0, 0, 0, 255] : [255, 255, 255, 254];
    this.paint(x, y, color as [number, number, number, number]);
    this.paintQTreeEdges(this.state.minSize);
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
      this.setState({ mouseDown: true, hoverCoords: null });
    }
    const [x, y] = this.getImageCoords(e);
    const color = this.state.painting ? [0, 0, 0, 255] : [255, 255, 255, 254];
    this.paint(x, y, color as [number, number, number, number]);
  }

  private paint(x: number, y: number, color: [number, number, number, number]) {
    if (!this.imageData || !this.canvasContext) {
      return;
    }
    const { data } = this.imageData;

    const r = this.state.radius;
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
        data[i + 0] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
        data[i + 3] = color[3];
      }
    }
    this.canvasContext.putImageData(this.imageData, 0, 0);
  }
}

export default DrawableCanvas;
