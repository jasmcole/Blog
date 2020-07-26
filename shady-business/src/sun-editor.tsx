import * as React from "react";

import { InputWithRange } from "./input";
import { SunParams } from "./calculate";

const SunEditor: React.FC<{
  sunParams: SunParams;
  onUpdate: (sunParams: SunParams) => void;
}> = ({ sunParams, onUpdate }) => {
  return (
    <>
      <InputWithRange
        label="day of year"
        range={[0, 364]}
        value={String(sunParams.day_of_year)}
        onChange={(x) => onUpdate({ ...sunParams, day_of_year: Number(x) })}
      />
      <InputWithRange
        label="hour of day"
        range={[0, 24]}
        value={String(sunParams.hour_of_day)}
        onChange={(x) => onUpdate({ ...sunParams, hour_of_day: Number(x) })}
      />
      <InputWithRange
        label="latitude"
        range={[0, 90]}
        value={String(sunParams.lat_deg)}
        onChange={(x) => onUpdate({ ...sunParams, lat_deg: Number(x) })}
      />
    </>
  );
};

export default SunEditor;
