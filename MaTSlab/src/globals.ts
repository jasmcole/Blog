declare interface Data {
  x?: number[];
  y?: number[];
}

declare type VecOrArray = Vec | number[];

declare interface Figure {
  plot: (x: VecOrArray, y: VecOrArray) => Promise<Data[]>;
  scatter: (x: VecOrArray, y: VecOrArray) => Promise<Data[]>;
  area: (x: VecOrArray, y: VecOrArray) => Promise<Data[]>;
  image: (
    x: VecOrArray,
    y: VecOrArray,
    z: Mat,
    colormap?: string,
  ) => Promise<Data[]>;
}

declare class Vec {
  constructor(arr: number[]);
  length: number;
  arr: number[];
  add(num: number | Vec): Vec;
  sub(num: number | Vec): Vec;
  mul(num: number | Vec): Vec;
  div(num: number | Vec): Vec;
  map(m: (value: number, i: number) => number): Vec;
}

declare class Mat {
  constructor(arr: number[][]);
  size: [number, number];
  arr: number[][];
  add(num: number | Mat): Mat;
  sub(num: number | Mat): Mat;
  mul(num: number | Mat): Mat;
  div(num: number | Mat): Mat;
  map(m: (value: number, i: number, j: number) => number): Mat;
}

declare function withFig(figNum: number, callback: (f: Figure) => void): void;
declare function fig(figNum: number): Figure;
declare function render(element: JSX.Element): void;
declare function linspace(start: number, stop: number, step: number): Vec;
declare function meshgrid(x: VecOrArray, y: VecOrArray): [Mat, Mat];
declare function zeros_like(x: Mat): Mat;
declare function openFile(): Promise<ArrayBuffer>;

declare function sin(arr: VecOrArray): Vec;
declare function cos(arr: VecOrArray): Vec;
declare function tan(arr: VecOrArray): Vec;
declare function exp(arr: VecOrArray): Vec;
declare function pow(arr: VecOrArray, power: number): Vec;

type Fig = typeof fig;
type WithFig = typeof withFig;

declare interface Globals {
  fig: Fig;
  withFig: WithFig;
}
