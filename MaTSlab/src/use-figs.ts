import { PlotParams } from 'react-plotly.js';
import * as React from 'react';

export type Figs = Array<{
  figNum: number;
  data: PlotParams['data'] | null;
  onAfterPlot: null | (() => void);
}>;

export const useFigs = (params: {
  onPlot?: (figNum: number) => void;
  figs?: Figs;
}) => {
  const [figs, setFigs] = React.useState<Figs>(params.figs ?? []);

  React.useEffect(() => {
    const plotImpl = (
      figNum: number,
      data: PlotParams['data'],
      accumulator?: PlotParams['data'],
    ) =>
      new Promise<Data[]>(resolve => {
        accumulator?.push(...data);
        const fig = figs.find(f => f.figNum === figNum);
        if (!fig) {
          setFigs(f => [
            ...f,
            {
              figNum,
              data,
              onAfterPlot: () => {
                params.onPlot?.(figNum);
                setTimeout(() => resolve(data as Data[]), 1);
              },
            },
          ]);
          return;
        }
        setFigs(f =>
          f.map(ff =>
            ff.figNum === figNum
              ? {
                  ...ff,
                  data,
                  onAfterPlot: () => {
                    params.onPlot?.(figNum);
                    setTimeout(() => resolve(data as Data[]), 1);
                  },
                }
              : ff,
          ),
        );
      });

    const toArr = (voa: VecOrArray): number[] =>
      Array.isArray(voa) ? voa : voa.arr;

    const figImpl = (figNum: number, accumulator?: PlotParams['data']) => ({
      area: (x: VecOrArray, y: VecOrArray) =>
        plotImpl(
          figNum,
          [{ x: toArr(x), y: toArr(y), type: 'scatter', fill: 'tozeroy' }],
          accumulator,
        ),
      plot: (x: VecOrArray, y: VecOrArray) =>
        plotImpl(
          figNum,
          [{ x: toArr(x), y: toArr(y), type: 'scatter' }],
          accumulator,
        ),
      scatter: (x: VecOrArray, y: VecOrArray) =>
        plotImpl(
          figNum,
          [{ x: toArr(x), y: toArr(y), type: 'scatter', mode: 'markers' }],
          accumulator,
        ),
      image: (x: VecOrArray, y: VecOrArray, z: Mat, colormap?: string) =>
        plotImpl(
          figNum,
          [
            {
              x: toArr(x),
              y: toArr(y),
              z: z.arr,
              type: 'heatmapgl',
              colorscale: colormap ?? 'Viridis',
            },
          ],
          accumulator,
        ),
    });

    const withFigImpl: WithFig = (figNum: number, cb: any): Promise<Data[]> => {
      const data: PlotParams['data'] = [];
      cb(figImpl(figNum, data));
      return plotImpl(figNum, data);
    };

    const globals: Globals = {
      fig: figImpl,
      withFig: withFigImpl,
    };

    Object.assign(window, globals);
  }, [figs]);

  const addFig = React.useCallback(() => {
    const maxFigNum = figs.reduce((acc, curr) => Math.max(curr.figNum, acc), 0);
    const newFigs = [
      ...figs,
      { figNum: maxFigNum + 1, data: null, onAfterPlot: null },
    ];
    setFigs(newFigs);
    return maxFigNum + 1;
  }, [figs]);

  const removeFig = React.useCallback((figNum: number) => {
    setFigs(f => f.filter(ff => ff.figNum !== figNum));
  }, []);

  return { figs, addFig, removeFig, setFigs };
};
