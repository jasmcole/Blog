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

export interface House {
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  rotation: number;
  type: "house";
  id: number;
}

export const makeHouse = (): House => ({
  type: "house",
  x: 15,
  y: 15,
  depth: 6,
  width: 10,
  height: 5,
  rotation: 0,
  id: Math.round(Math.random() * 1e10),
});

const HouseOuter = styled.div<{ active: boolean }>`
  user-select: none;
  cursor: move;
  position: absolute;
  background: ${(p) => (p.active ? `rgba(117, 0, 255, 0.5)` : `none`)};
  border: ${(p) => (p.active ? "none" : "2px solid rgb(117, 0, 255)")};
`;

export const House: React.FC<{
  active: boolean;
  house: House;
  artboardPosition: ArtboardPosition;
  onSelect: (mouseDown: MouseDownShape) => void;
}> = React.memo(({ active, artboardPosition, house, onSelect }) => {
  const [height, width] = [
    house.depth / artboardPosition.unitsPerPixel,
    house.width / artboardPosition.unitsPerPixel,
  ];

  return (
    <>
      <HouseOuter
        active={active}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSelect(makeMouseDown(e, house, "translate", artboardPosition));
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          onSelect(makeMouseDown(e, house, "translate", artboardPosition));
        }}
        onDrag={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        style={{
          height,
          width,
          transform: getTransform(house, artboardPosition),
        }}
      >
        {active && (
          <RotHandle
            onMouseDown={(e) => {
              e.stopPropagation();
              onSelect(makeMouseDown(e, house, "rotate", artboardPosition));
            }}
          />
        )}
        {active && (
          <ScaleHandle
            onMouseDown={(e) => {
              e.stopPropagation();
              onSelect(makeMouseDown(e, house, "scale", artboardPosition));
            }}
          />
        )}
      </HouseOuter>
      <HouseOuter
        active={active}
        onDrag={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        style={{
          height: 1,
          width,
          transform: getTransform(house, artboardPosition),
        }}
      />
    </>
  );
});
