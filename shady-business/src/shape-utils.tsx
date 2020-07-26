import { Shape } from "./shapes";
import * as React from "react";
import styled from "styled-components";
import { ArtboardPosition } from "./artboard";

export interface MouseDownShape {
  x: number; // Mouse down position - pixels
  y: number;
  rot: number; // Mouse down rotation - radians
  shape: Shape;
  handle: "translate" | "rotate" | "scale";
  preserveAspect: boolean;
}

export interface MouseDownArtboard {
  x: number; // Mouse down position - pixels
  y: number;
  artboardPosition: ArtboardPosition;
  handle: "artboard";
}

export type MouseDown = MouseDownShape | MouseDownArtboard;

export const makeMouseDown = (
  e:
    | React.MouseEvent<HTMLDivElement, MouseEvent>
    | React.TouchEvent<HTMLDivElement>,
  shape: Shape,
  handle: MouseDownShape["handle"],
  artboardPosition: ArtboardPosition,
  preserveAspect = false
): MouseDownShape => {
  const [shapeX, shapeY] = toPx([shape.x, shape.y], artboardPosition);

  const touches = (e as React.TouchEvent<HTMLDivElement>).touches;
  let clientX = (e as React.MouseEvent<HTMLDivElement, MouseEvent>).clientX;
  let clientY = (e as React.MouseEvent<HTMLDivElement, MouseEvent>).clientY;

  if (!clientX && touches) {
    clientX = touches[0].clientX;
  }

  if (!clientY && touches) {
    clientY = touches[0].clientY;
  }

  const dxPx = clientX - shapeX;
  const dyPx = clientY - shapeY;
  const rot = Math.atan2(dyPx, dxPx);

  return {
    x: clientX,
    y: clientY,
    rot,
    shape,
    handle,
    preserveAspect,
  };
};

export const fromPx = (
  pix: [number, number],
  artboardPosition: ArtboardPosition,
  noOffset: boolean = false
): [number, number] => [
  pix[0] * artboardPosition.unitsPerPixel +
    (noOffset ? 0 : artboardPosition.offset.x),
  pix[1] * artboardPosition.unitsPerPixel +
    (noOffset ? 0 : artboardPosition.offset.y),
];

export const toPx = (
  pos: [number, number],
  artboardPosition: ArtboardPosition,
  noOffset: boolean = false
): [number, number] => [
  (pos[0] - (noOffset ? 0 : artboardPosition.offset.x)) /
    artboardPosition.unitsPerPixel,
  (pos[1] - (noOffset ? 0 : artboardPosition.offset.y)) /
    artboardPosition.unitsPerPixel,
];

export const getTransform = (
  pos: { x: number; y: number; rotation: number },
  artboardPosition: ArtboardPosition
) => {
  const [x, y] = toPx([pos.x, pos.y], artboardPosition);

  return `translate(calc(${x}px - 50%), calc(${y}px - 50%)) rotate(${pos.rotation}deg)`;
};

export const ScaleHandle = styled.div`
  position: absolute;
  left: 100%;
  top: 100%;
  transform: translate(-50%, -50%);
  background: white;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 1px solid black;
  cursor: nwse-resize;

  &:hover {
    background: rgb(230, 230, 230);
  }
`;

const RotHandleOuter = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 1px solid black;
  cursor: pointer;
  background: white;

  &:hover {
    background: rgb(230, 230, 230);
  }
`;

export const RotHandle: React.FC<{
  style?: React.CSSProperties;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}> = ({ style, onMouseDown }) => (
  <RotHandleOuter style={style} onMouseDown={onMouseDown}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22">
      <defs>
        <clipPath>
          <path d="m0 706.47h1490.93v-706.47h-1490.93v706.47" />
        </clipPath>
        <clipPath>
          <path d="m22.2 686.12h1447.73v-667.19h-1447.73v667.19" />
        </clipPath>
        <clipPath>
          <path fill="#f2f2f2" d="m7 1023.36h1v1h-1z" />
        </clipPath>
        <clipPath>
          <path fill="#00f" fillOpacity=".514" d="m-7 1024.36h34v34h-34z" />
        </clipPath>
        <clipPath>
          <path fill="#aade87" fillOpacity=".472" d="m-6 1028.36h32v32h-32z" />
        </clipPath>
      </defs>
      <path
        d="m120.6 38.723c-3.312-7.713-7.766-14.367-13.36-19.961-5.595-5.594-12.248-10.05-19.962-13.361-7.713-3.314-15.805-4.97-24.278-4.97-7.984 0-15.71 1.506-23.18 4.521-7.468 3.01-14.11 7.265-19.92 12.751l-10.593-10.511c-1.63-1.684-3.503-2.064-5.622-1.141-2.173.924-3.259 2.527-3.259 4.808v36.5c0 1.412.516 2.634 1.548 3.666 1.033 1.032 2.255 1.548 3.667 1.548h36.5c2.282 0 3.884-1.086 4.807-3.259.923-2.118.543-3.992-1.141-5.622l-11.162-11.243c3.803-3.585 8.148-6.341 13.04-8.27 4.889-1.928 9.994-2.893 15.317-2.893 5.649 0 11.04 1.101 16.17 3.3 5.133 2.2 9.572 5.174 13.32 8.922 3.748 3.747 6.722 8.187 8.922 13.32 2.199 5.133 3.299 10.523 3.299 16.17 0 5.65-1.1 11.04-3.299 16.17-2.2 5.133-5.174 9.573-8.922 13.321-3.748 3.748-8.188 6.722-13.32 8.921-5.133 2.2-10.525 3.3-16.17 3.3-6.464 0-12.574-1.412-18.332-4.236-5.757-2.824-10.618-6.816-14.583-11.977-.38-.543-1-.87-1.874-.979-.815 0-1.494.244-2.037.733l-11.162 11.244c-.434.436-.665.991-.692 1.67-.027.68.15 1.29.53 1.833 5.921 7.17 13.09 12.724 21.509 16.661 8.419 3.937 17.3 5.907 26.642 5.907 8.473 0 16.566-1.657 24.279-4.97 7.713-3.313 14.365-7.768 19.961-13.361 5.594-5.596 10.05-12.248 13.361-19.961 3.313-7.713 4.969-15.807 4.969-24.279 0-8.474-1.657-16.564-4.97-24.277"
        transform="matrix(-.12786 0 0 .12786 19.05 2.948)"
        fill="#4d4d4d"
      />
    </svg>
  </RotHandleOuter>
);
