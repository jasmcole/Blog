import * as React from 'react';
import Plot, { PlotParams } from 'react-plotly.js';

export const Figure: React.FC<{
  figNum: number;
  data: PlotParams['data'] | null;
  onAfterPlot: null | (() => void);
}> = ({ figNum, data, onAfterPlot }) => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      {data && (
        <Plot
          data={data}
          layout={{
            // title: `Figure ${figNum}`,
            margin: { t: 50, b: 50, l: 50, r: 50 },
          }}
          style={{ height: '100%', width: '100%' }}
          onAfterPlot={onAfterPlot ?? undefined}
        />
      )}
    </div>
  );
};
