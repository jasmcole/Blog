import * as React from "react";
import { Input } from "./input";
import { House } from "./house";

const HouseEditor: React.FC<{
  house: House;
  onUpdate: (house: House) => void;
}> = ({ house, onUpdate }) => {
  return (
    <>
      <Input
        label="x"
        value={String(house.x)}
        onChange={(x) => onUpdate({ ...house, x: Number(x) })}
      />
      <Input
        label="y"
        value={String(house.y)}
        onChange={(y) => onUpdate({ ...house, y: Number(y) })}
      />
      <Input
        label="width"
        value={String(house.width)}
        onChange={(width) => onUpdate({ ...house, width: Number(width) })}
      />
      <Input
        label="depth"
        value={String(house.depth)}
        onChange={(depth) => onUpdate({ ...house, depth: Number(depth) })}
      />
      <Input
        label="height"
        value={String(house.height)}
        onChange={(height) => onUpdate({ ...house, height: Number(height) })}
      />
      <Input
        label="rotation"
        value={String(house.rotation)}
        onChange={(rot) => onUpdate({ ...house, rotation: Number(rot) })}
      />
    </>
  );
};

export default HouseEditor;
