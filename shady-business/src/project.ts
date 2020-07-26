import { Rect } from "./rect";
import { House } from "./house";

type Vec3D = [number, number, number];
type Vec2D = [number, number];
export type Quad = [Vec2D, Vec2D, Vec2D, Vec2D];

// x points East, y points North, z points straight up
export const vec_norm_to_sun = (
  zenith_deg: number,
  azimuth_deg: number
): Vec3D => {
  const zenith_rad = (zenith_deg * Math.PI) / 180;
  const azimuth_rad = (azimuth_deg * Math.PI) / 180;
  return [
    Math.cos(zenith_rad) * Math.sin(azimuth_rad),
    -Math.cos(zenith_rad) * Math.cos(azimuth_rad), // Flip this so up on the screen is North
    Math.sin(zenith_rad),
  ];
};

// Project a 3D point to the ground plane (z = 0) along vector n (assumed pointing at the sun)
const projectShadow = (point: Vec3D, n: Vec3D): Vec2D => {
  if (n[2] < 0) {
    throw new Error("Expected n to point upwards");
  }
  const t = point[2] / n[2]; // Maths
  return [point[0] - t * n[0], point[1] - t * n[1]];
};

const rot = (xy: Vec2D, r: number): Vec2D => {
  const c = Math.cos((-r * Math.PI) / 180);
  const s = Math.sin((-r * Math.PI) / 180);
  const [x, y] = xy;
  return [c * x + s * y, -s * x + c * y];
};

export const getRectVertices = <
  T extends {
    x: number;
    y: number;
    width: number;
    depth: number;
    rotation: number;
  }
>(
  rect: T
): Vec2D[] => {
  const w2 = rect.width / 2;
  const h2 = rect.depth / 2;
  // Start at SW, go anticlockwise
  const corners: Vec2D[] = ([
    [-w2, -h2],
    [w2, -h2],
    [w2, h2],
    [-w2, h2],
  ] as Vec2D[])
    .map((p) => rot(p, rect.rotation))
    .map((p) => [p[0] + rect.x, p[1] + rect.y]);
  return corners;
};

export const projectRect = (rect: Rect, n: Vec3D): Quad[] => {
  const { x, y, width, depth, height, rotation } = rect;
  const base = getRectVertices(rect);
  const vertices: Vec3D[] = [
    ...base.map(([x, y]) => [x, y, 0] as Vec3D),
    ...base.map(([x, y]) => [x, y, height] as Vec3D),
  ];
  const faces = [
    [0, 1, 2, 3],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [0, 3, 7, 4],
    [0, 1, 5, 4],
    [4, 5, 6, 7],
  ];

  const projectedFaces: Quad[] = faces.map(
    (vertexIndices) =>
      vertexIndices.map((i) => projectShadow(vertices[i], n)) as Quad
  );

  return projectedFaces;
};

const midpoint = (a: Vec2D, b: Vec2D): Vec2D => [
  0.5 * (a[0] + b[0]),
  0.5 * (a[1] + b[1]),
];

export const projectHouse = (house: House, n: Vec3D): Quad[] => {
  const { x, y, width, depth, height, rotation } = house;
  const base = getRectVertices(house);
  const midPoints = [midpoint(base[1], base[2]), midpoint(base[0], base[3])];
  const vertices: Vec3D[] = [
    ...base.map(([x, y]) => [x, y, 0] as Vec3D),
    ...base.map(([x, y]) => [x, y, (height * 2) / 3] as Vec3D),
    ...midPoints.map(([x, y]) => [x, y, height] as Vec3D),
  ];
  const faces = [
    [0, 1, 2, 3],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [0, 3, 7, 4],
    [0, 1, 5, 4],
    [4, 5, 6, 7],
    [4, 5, 8, 9],
    [5, 6, 8, 8],
    [6, 7, 9, 8],
    [4, 7, 9, 9],
  ];

  const projectedFaces: Quad[] = faces.map(
    (vertexIndices) =>
      vertexIndices.map((i) => projectShadow(vertices[i], n)) as Quad
  );

  return projectedFaces;
};
