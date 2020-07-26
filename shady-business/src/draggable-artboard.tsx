import * as React from "react";
import styled from "styled-components";
import { MouseDownArtboard, fromPx } from "./shape-utils";
import { ArtboardPosition } from "./artboard";

export const Outer = styled.div<{ height: number; width: number }>`
  width: ${(p) => p.width}px;
  height: ${(p) => p.height}px;
  position: absolute;
`;

interface DraggableArtboardProps {
  position: ArtboardPosition;
  setArtboardPosition: (position: ArtboardPosition) => void;
}

interface DraggableArtboardState {
  mouseDown: MouseDownArtboard | null;
}

class DraggableArtboard extends React.Component<
  DraggableArtboardProps,
  DraggableArtboardState
> {
  public readonly state: DraggableArtboardState = { mouseDown: null };

  public constructor(props: DraggableArtboardProps) {
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
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  private handleMouseMove(e: MouseEvent) {
    const { position, setArtboardPosition } = this.props;
    const { mouseDown } = this.state;
    const { clientX, clientY } = e;

    if (!mouseDown) {
      return;
    }

    e.stopPropagation();

    switch (mouseDown.handle) {
      case "artboard": {
        const { x, y, artboardPosition } = mouseDown;
        const [dX, dY] = fromPx([clientX - x, clientY - y], position, true);
        const newX = artboardPosition.offset.x - dX;
        const newY = artboardPosition.offset.y - dY;
        setArtboardPosition({
          ...position,
          offset: {
            x: newX,
            y: newY,
          },
        });
        break;
      }
    }
  }

  private handleMouseUp() {
    this.setState({ mouseDown: null });
  }

  public render() {
    const { position } = this.props;

    return (
      <Outer
        height={position.pixelSize.height}
        width={position.pixelSize.width}
        onMouseDown={(e) => {
          this.setState({
            mouseDown: {
              artboardPosition: position,
              handle: "artboard",
              x: e.clientX,
              y: e.clientY,
            },
          });
        }}
      />
    );
  }
}

export default DraggableArtboard;
