import * as React from "react";
import styled from "styled-components";
import {
  makeMouseDown,
  getTransform,
  RotHandle,
  ScaleHandle,
  MouseDownShape,
} from "./shape-utils";
import { ArtboardPosition } from "./artboard";

export interface Rect {
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  rotation: number;
  type: "rect";
  id: number;
}

export const makeRect = (): Rect => ({
  type: "rect",
  x: 15,
  y: 15,
  depth: 6,
  width: 10,
  height: 5,
  rotation: 0,
  id: Math.round(Math.random() * 1e10),
});

const RectOuter = styled.div<{ active: boolean }>`
  user-select: none;
  cursor: move;
  position: absolute;
  background: ${(p) => (p.active ? `rgba(0, 117, 255, 0.5)` : `none`)};
  border: ${(p) => (p.active ? "none" : "2px solid rgb(0, 117, 255)")};
`;

export const Rectangle: React.FC<{
  active: boolean;
  rect: Rect;
  artboardPosition: ArtboardPosition;
  onSelect: (mouseDown: MouseDownShape) => void;
}> = React.memo(({ active, artboardPosition, rect, onSelect }) => {
  const [height, width] = [
    rect.depth / artboardPosition.unitsPerPixel,
    rect.width / artboardPosition.unitsPerPixel,
  ];

  return (
    <RectOuter
      active={active}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(makeMouseDown(e, rect, "translate", artboardPosition));
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        onSelect(makeMouseDown(e, rect, "translate", artboardPosition));
      }}
      onDrag={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        height,
        width,
        transform: getTransform(rect, artboardPosition),
      }}
    >
      {active && (
        <RotHandle
          onMouseDown={(e) => {
            e.stopPropagation();
            onSelect(makeMouseDown(e, rect, "rotate", artboardPosition));
          }}
        />
      )}
      {active && (
        <ScaleHandle
          onMouseDown={(e) => {
            e.stopPropagation();
            onSelect(makeMouseDown(e, rect, "scale", artboardPosition));
          }}
        />
      )}
    </RectOuter>
  );
});
