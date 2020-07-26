import * as React from "react";
import styled from "styled-components";
import { Shape } from "./shapes";
import { fromPx, toPx, MouseDownShape } from "./shape-utils";
import { Rectangle } from "./rect";
import { Image } from "./image";
import { House } from "./house";

export interface ArtboardPosition {
  offset: { x: number; y: number };
  pixelSize: { width: number; height: number };
  unitsPerPixel: number;
}

interface ArtboardProps {
  activeShape: Shape | undefined;
  position: ArtboardPosition;
  shapes: Shape[];
  onChangeShape: (newShape: Partial<Shape>, shape: Shape) => void;
  onSelect: (shape: Shape) => void;
}

interface ArtboardState {
  mouseDown: MouseDownShape | null;
}

class Artboard extends React.Component<ArtboardProps, ArtboardState> {
  public readonly state: ArtboardState = { mouseDown: null };

  public constructor(props: ArtboardProps) {
    super(props);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  public componentDidMount() {
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  public componentWillUnmount() {
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mousemove", this.handleMouseUp);
  }

  private handleMouseMove(e: MouseEvent) {
    const { position, onChangeShape } = this.props;
    const { mouseDown } = this.state;
    const { clientX, clientY } = e;

    if (!mouseDown) {
      return;
    }

    switch (mouseDown.handle) {
      case "translate": {
        const { x, y, rot, shape } = mouseDown;
        const [dX, dY] = fromPx([clientX - x, clientY - y], position, true);
        const newX = shape.x + dX;
        const newY = shape.y + dY;
        onChangeShape(
          {
            x: Math.round(newX * 1000) / 1000,
            y: Math.round(newY * 1000) / 1000,
          },
          shape
        );
        break;
      }
      case "rotate": {
        const { x, y, rot, shape } = mouseDown;
        const [shapeX, shapeY] = toPx([shape.x, shape.y], position);
        const dxPx = clientX - shapeX;
        const dyPx = clientY - shapeY;
        const thisRot = Math.atan2(dyPx, dxPx);
        const deltaRot = thisRot - rot; // Still in radians

        const newRot = shape.rotation + (deltaRot * 180) / Math.PI; // Degrees

        onChangeShape(
          {
            rotation: Math.round(newRot * 10) / 10,
          },
          shape
        );
        break;
      }
      case "scale": {
        const { x, y, rot, shape, preserveAspect } = mouseDown;

        const c = Math.cos((shape.rotation * Math.PI) / 180);
        const s = Math.sin((shape.rotation * Math.PI) / 180);

        const dxPx = clientX - x;
        const dyPx = clientY - y;

        const dwPx = c * dxPx + s * dyPx;
        const ddPx = -s * dxPx + c * dyPx;

        let [dw, dd] = fromPx([dwPx, ddPx], position, true);

        if (preserveAspect) {
          const aspect = shape.width / shape.depth;
          if (dd > dw) {
            dd = dw / aspect;
          } else {
            dw = dd * aspect;
          }
        }

        const newWidth = Math.max(0.1, shape.width + 2 * dw);
        const newDepth = Math.max(0.1, shape.depth + 2 * dd);

        const [dx, dy] = fromPx([dxPx / 2, dyPx / 2], position, true);

        onChangeShape(
          {
            width: Math.round(newWidth * 1000) / 1000,
            depth: Math.round(newDepth * 1000) / 1000,
          },
          shape
        );
        break;
      }
    }
  }

  private handleMouseUp() {
    this.setState({ mouseDown: null });
  }

  public render() {
    const { activeShape, position, shapes, onSelect } = this.props;

    const commonShapeProps = (shape: Shape) => ({
      active: !!(activeShape && activeShape.id === shape.id),
      artboardPosition: position,
      key: shape.id,
      onSelect: (mouseDown: MouseDownShape) => {
        onSelect(mouseDown.shape);
        this.setState({ mouseDown });
      },
    });

    return (
      <>
        {shapes.map((shape) =>
          shape.type === "rect" ? (
            <Rectangle rect={shape} {...commonShapeProps(shape)} />
          ) : shape.type === "image" ? (
            <Image image={shape} {...commonShapeProps(shape)} />
          ) : shape.type === "house" ? (
            <House house={shape} {...commonShapeProps(shape)} />
          ) : null
        )}
      </>
    );
  }
}

export default Artboard;
