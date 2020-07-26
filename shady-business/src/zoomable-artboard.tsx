import * as React from "react";
import styled from "styled-components";
import { ArtboardPosition } from "./artboard";

export const Outer = styled.div<{ height: number; width: number }>`
  width: ${(p) => p.width}px;
  height: ${(p) => p.height}px;
  position: absolute;
`;

interface ZoomableArtboardProps {
  position: ArtboardPosition;
  setArtboardPosition: (position: ArtboardPosition) => void;
}

const ZoomableArtboard: React.FC<ZoomableArtboardProps> = ({
  position,
  setArtboardPosition,
  children,
}) => {
  const handleMouseWheel = React.useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.stopPropagation();

      const { clientX, clientY, deltaY } = e;

      const delta = 1 + deltaY * 0.001;
      const newUnitsPerPixel = position.unitsPerPixel * delta;
      const newWidth = position.pixelSize.width * newUnitsPerPixel;
      const newHeight = position.pixelSize.height * newUnitsPerPixel;

      // Maths. Not sure where the 10px offset comes from
      const newX =
        position.offset.x +
        ((clientX - 10) / position.pixelSize.width) * newWidth * (1 - delta);
      const newY =
        position.offset.y +
        ((clientY - 10) / position.pixelSize.height) * newHeight * (1 - delta);

      setArtboardPosition({
        offset: { x: newX, y: newY },
        pixelSize: position.pixelSize,
        unitsPerPixel: newUnitsPerPixel,
      });
    },
    [position, setArtboardPosition]
  );

  return (
    <Outer
      height={position.pixelSize.height}
      width={position.pixelSize.width}
      onWheel={handleMouseWheel}
    >
      {children}
    </Outer>
  );
};

export default ZoomableArtboard;
