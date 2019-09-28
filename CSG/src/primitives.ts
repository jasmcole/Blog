export interface Sphere {
  x: number;
  y: number;
  z: number;
  r: number;
  type: "sphere";
}

export const isSphere = (prim: Primitive): prim is Sphere =>
  prim.type === "sphere";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "box";
}

export const isBox = (prim: Primitive): prim is Box => prim.type === "box";

export type Primitive = Sphere | Box;
