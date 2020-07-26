import * as React from "react";
import { Input } from "./input";
import { Rect } from "./rect";

const RectEditor: React.FC<{ rect: Rect; onUpdate: (rect: Rect) => void }> = ({
  rect,
  onUpdate,
}) => {
  return (
    <>
      <Input
        label="x"
        value={String(rect.x)}
        onChange={(x) => onUpdate({ ...rect, x: Number(x) })}
      />
      <Input
        label="y"
        value={String(rect.y)}
        onChange={(y) => onUpdate({ ...rect, y: Number(y) })}
      />
      <Input
        label="width"
        value={String(rect.width)}
        onChange={(width) => onUpdate({ ...rect, width: Number(width) })}
      />
      <Input
        label="depth"
        value={String(rect.depth)}
        onChange={(depth) => onUpdate({ ...rect, depth: Number(depth) })}
      />
      <Input
        label="height"
        value={String(rect.height)}
        onChange={(height) => onUpdate({ ...rect, height: Number(height) })}
      />
      <Input
        label="rotation"
        value={String(rect.rotation)}
        onChange={(rot) => onUpdate({ ...rect, rotation: Number(rot) })}
      />
    </>
  );
};

export default RectEditor;
