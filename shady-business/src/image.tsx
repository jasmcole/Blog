import * as React from "react";
import styled from "styled-components";
import {
  MouseDown,
  makeMouseDown,
  toPx,
  getTransform,
  RotHandle,
  ScaleHandle,
  MouseDownShape,
} from "./shape-utils";
import { ArtboardPosition } from "./artboard";
import { getRectVertices } from "./project";

export interface Image {
  x: number;
  y: number;
  width: number;
  depth: number;
  rotation: number;
  type: "image";
  id: number;
  src: string;
}

export const makeImage = (
  src: string,
  width: number,
  height: number
): Image => ({
  type: "image",
  x: 15,
  y: 15,
  width,
  depth: height,
  rotation: 0,
  src,
  id: Math.round(Math.random() * 1e10),
});

export const Image: React.FC<{
  active: boolean;
  image: Image;
  artboardPosition: ArtboardPosition;
  onSelect: (mouseDown: MouseDownShape) => void;
}> = React.memo(({ active, artboardPosition, image, onSelect }) => {
  const [height, width] = toPx(
    [image.depth, image.width],
    artboardPosition,
    true
  );

  const vertices = getRectVertices(image);

  return (
    <>
      <img
        src={image.src}
        width={width}
        height={height}
        style={{
          position: "absolute",
          pointerEvents: "none",
          transform: getTransform(image, artboardPosition),
          userSelect: "none",
        }}
        onClick={(e) => e.preventDefault()}
        onMouseDown={(e) => e.preventDefault()}
        onDrag={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
      <RotHandle
        style={{
          transform: getTransform(
            {
              x: vertices[0][0],
              y: vertices[0][1],
              rotation: image.rotation,
            },
            artboardPosition
          ),
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSelect(makeMouseDown(e, image, "rotate", artboardPosition));
        }}
        // onDrag={(e) => e.preventDefault()}
        // onDragStart={(e) => e.preventDefault()}
      />
      <ScaleHandle
        style={{
          left: 0,
          top: 0,
          transform: getTransform(
            {
              x: vertices[2][0],
              y: vertices[2][1],
              rotation: image.rotation,
            },
            artboardPosition
          ),
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSelect(makeMouseDown(e, image, "scale", artboardPosition, true));
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          onSelect(makeMouseDown(e, image, "scale", artboardPosition, true));
        }}
        onDrag={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </>
  );
});
