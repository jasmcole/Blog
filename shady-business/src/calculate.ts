import { Quad, vec_norm_to_sun, projectRect, projectHouse } from "./project";
import { zenith_azimuth_deg } from "./sun-angles";
import { projectViridis } from "./colormaps";
import { dayRefiner, yearRefiner } from "./refiners";
import { Shape } from "./shapes";
import { ArtboardPosition } from "./artboard";
import { toPx } from "./shape-utils";
import { FluxBuffer } from "./flux-buffer";

export interface SunParams {
  day_of_year: number;
  hour_of_day: number;
  min_of_hour: number;
  sec_of_min: number;
  lat_deg: number;
  long_deg: number;
}

export interface AverageParams {
  colormap: "viridis" | "spectral";
  numIter: number;
  resolutionScale: number;
  scale: "log" | "linear";
  plotType: "time" | "flux";
}

export const calculate = (
  canvasRef: HTMLCanvasElement,
  shapes: Shape[],
  params: SunParams,
  artboardPosition: ArtboardPosition,
  avParams: AverageParams
) => {
  if (shapes.length === 0) {
    return;
  }

  const ctx = canvasRef.getContext("2d");

  if (!ctx) {
    return;
  }

  const {
    day_of_year,
    hour_of_day,
    min_of_hour,
    sec_of_min,
    lat_deg,
    long_deg,
  } = params;

  const { fromHorizon, fromNorth } = zenith_azimuth_deg(
    day_of_year,
    hour_of_day,
    min_of_hour,
    sec_of_min,
    lat_deg,
    long_deg
  );

  const n = vec_norm_to_sun(fromHorizon, fromNorth);

  ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);

  const quads = shapes.map((shape) => {
    switch (shape.type) {
      case "rect": {
        const quads = projectRect(shape, n);
        for (const q of quads) {
          drawQuad(q, ctx, artboardPosition, avParams);
        }
        return quads;
      }
      case "house": {
        const quads = projectHouse(shape, n);
        for (const q of quads) {
          drawQuad(q, ctx, artboardPosition, avParams);
        }
        return quads;
      }
    }
  });

  return {
    imageData: ctx.getImageData(0, 0, canvasRef.width, canvasRef.height),
    fromHorizon,
    fromNorth,
  };
};

const drawQuad = (
  q: Quad,
  ctx: CanvasRenderingContext2D,
  artboardPosition: ArtboardPosition,
  avParams: AverageParams,
  fill: string = "black)"
): void => {
  const px = q.map((q) =>
    toPx(q, {
      ...artboardPosition,
      unitsPerPixel: artboardPosition.unitsPerPixel / avParams.resolutionScale,
    })
  );
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(...px[0]);
  ctx.lineTo(...px[1]);
  ctx.lineTo(...px[2]);
  ctx.lineTo(...px[3]);
  ctx.fill();
};

export type CalcRefiner = Generator<{
  sunParams: SunParams;
  i: number;
  numIter: number;
}>;

const calculateRange = async (
  canvasRef: HTMLCanvasElement,
  accCanvasRef: HTMLCanvasElement,
  shapes: Shape[],
  refiner: CalcRefiner,
  avParams: AverageParams,
  artboardPosition: ArtboardPosition,
  onProgress: (params: { fractionDone: number; result: FluxBuffer }) => void
) => {
  const plotContext = accCanvasRef.getContext("2d");

  if (!plotContext) {
    return;
  }

  const fluxBuffer = new FluxBuffer(
    {
      width: Math.round(
        artboardPosition.pixelSize.width * avParams.resolutionScale
      ),
      height: Math.round(
        artboardPosition.pixelSize.height * avParams.resolutionScale
      ),
    },
    avParams.resolutionScale,
    plotContext
  );

  let last = window.performance.now();

  for (const { sunParams, i, numIter } of refiner) {
    try {
      const results = calculate(
        canvasRef,
        shapes,
        sunParams,
        artboardPosition,
        avParams
      );
      if (results) {
        const { imageData, fromHorizon, fromNorth } = results;
        fluxBuffer.accumulate(imageData, fromHorizon);

        const delta = window.performance.now() - last;

        if (delta > 200) {
          last = window.performance.now();

          onProgress({ fractionDone: i / numIter, result: fluxBuffer });
          await new Promise((r) => setTimeout(r, 0));
        }
      }
    } catch (err) {
      // ...
    }
  }
  onProgress({ fractionDone: 0, result: fluxBuffer });
};

const makeCalc = (
  makeRefiner: (params: SunParams, avParams: AverageParams) => CalcRefiner
) => async (
  canvasRef: HTMLCanvasElement,
  accCanvasRef: HTMLCanvasElement,
  shapes: Shape[],
  params: SunParams,
  avParams: AverageParams,
  artboardPosition: ArtboardPosition,
  onProgress: (params: { fractionDone: number; result: FluxBuffer }) => void
) =>
  calculateRange(
    canvasRef,
    accCanvasRef,
    shapes,
    makeRefiner(params, avParams),
    avParams,
    artboardPosition,
    onProgress
  );

export const calculateDay = makeCalc((params, avParams) =>
  dayRefiner(params, avParams)
);

export const calculateYear = makeCalc((params, avParams) =>
  yearRefiner(params, avParams)
);
