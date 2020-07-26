import * as React from "react";

import { InputWithRange, InputSelect } from "./input";
import { AverageParams } from "./calculate";

const AvEditor: React.FC<{
  avParams: AverageParams;
  onUpdate: (avParams: AverageParams) => void;
}> = ({ avParams, onUpdate }) => {
  return (
    <>
      <InputWithRange
        label="iterations"
        range={[10, 10000]}
        value={String(avParams.numIter)}
        onChange={(x) => onUpdate({ ...avParams, numIter: Number(x) })}
      />
      <InputWithRange
        label="resolution scale"
        range={[1, 10]}
        value={String(avParams.resolutionScale * 10)}
        onChange={(x) =>
          onUpdate({ ...avParams, resolutionScale: Number(x) / 10 })
        }
      />
      <InputSelect
        label="plot"
        options={[
          ["flux", "Flux"],
          ["time", "Time"],
        ]}
        value={avParams.plotType}
        onChange={(x) =>
          onUpdate({ ...avParams, plotType: x === "time" ? "time" : "flux" })
        }
      />
      <InputSelect
        label="colormap"
        options={[
          ["spectral", "Spectral"],
          ["viridis", "Viridis"],
        ]}
        value={avParams.colormap}
        onChange={(x) =>
          onUpdate({
            ...avParams,
            colormap: x === "spectral" ? "spectral" : "viridis",
          })
        }
      />
    </>
  );
};

export default AvEditor;
