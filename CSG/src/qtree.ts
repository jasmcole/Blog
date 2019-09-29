export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const size = (rect: Rect): { width: number; height: number } => {
  const width = rect.right - rect.left + 1;
  const height = rect.bottom - rect.top + 1;
  return { width, height };
};

const makeQuads = (rect: Rect): Rect[] => {
  const { left, right, top, bottom } = rect;
  const midX = Math.floor(0.5 * (left + right));
  const midY = Math.floor(0.5 * (top + bottom));
  return [
    { left, right: midX, top, bottom: midY },
    { left: midX + 1, right, top, bottom: midY },
    { left: midX + 1, right, top: midY + 1, bottom },
    { left, right: midX, top: midY + 1, bottom }
  ];
};

const classify = (imageData: ImageData, rect: Rect): 0 | 0.5 | 1 => {
  const { left, right, top, bottom } = rect;
  const { data, width, height } = imageData;
  let min: number = Infinity;
  let max: number = -Infinity;

  // Just look at opacity channel
  for (let x = left; x <= right; x++) {
    for (let y = top; y <= bottom; y++) {
      const ind = 4 * (y * width + x);
      const val = data[ind + 3];
      if (val < min) {
        min = val;
      }
      if (val > max) {
        max = val;
      }
    }
  }

  if (min === 0 && max === 0) {
    return 0;
  }
  if (min === 255 && max === 255) {
    return 1;
  }
  return 0.5;
};

const merge_h = (quads: Rect[]): Rect => {
  if (quads.length === 0) {
    throw new Error("Must provide rects to merge");
  }
  const left = Math.min(...quads.map(q => q.left));
  const right = Math.max(...quads.map(q => q.right));
  const { top, bottom } = quads[0];
  return { left, right, top, bottom };
};

const merge_v = (quads: Rect[]): Rect => {
  if (quads.length === 0) {
    throw new Error("Must provide rects to merge");
  }
  const top = Math.min(...quads.map(q => q.top));
  const bottom = Math.max(...quads.map(q => q.bottom));
  const { left, right } = quads[0];
  return { left, right, top, bottom };
};

const qtree = (imageData: ImageData, minSize: number): Rect[] => {
  const { width, height } = imageData;
  const rects: Array<Rect> = [
    { left: 0, right: width - 1, top: 0, bottom: height - 1 }
  ];
  const finalRects: Array<Rect> = [];
  let iterCount = 0;

  while (rects.length > 0) {
    const rect = rects.pop()!;
    const { width, height } = size(rect);

    if (width < minSize || height < minSize) {
      continue;
    }
    const quads = makeQuads(rect);
    const classes = quads.map(q => classify(imageData, q));

    if (
      classes[0] == 1 &&
      classes[1] == 1 &&
      classes[2] == 1 &&
      classes[3] == 1
    ) {
      finalRects.push(rect);
    } else if (classes[0] == 1 && classes[3] == 1) {
      finalRects.push(merge_v([quads[0], quads[3]]));
      if (classes[1] > 0) {
        rects.push(quads[1]);
      }
      if (classes[2] > 0) {
        rects.push(quads[2]);
      }
    } else if (classes[1] == 1 && classes[2] == 1) {
      finalRects.push(merge_v([quads[1], quads[2]]));
      if (classes[0] > 0) {
        rects.push(quads[0]);
      }
      if (classes[3] > 0) {
        rects.push(quads[3]);
      }
    } else if (classes[2] == 1 && classes[3] == 1) {
      finalRects.push(merge_h([quads[2], quads[3]]));
      if (classes[0] > 0) {
        rects.push(quads[0]);
      }
      if (classes[1] > 0) {
        rects.push(quads[1]);
      }
    } else if (classes[0] == 1 && classes[1] == 1) {
      finalRects.push(merge_h([quads[0], quads[1]]));
      if (classes[2] > 0) {
        rects.push(quads[2]);
      }
      if (classes[3] > 0) {
        rects.push(quads[3]);
      }
    } else {
      for (let i = 0; i < classes.length; i++) {
        if (classes[i] == 1) {
          finalRects.push(quads[i]);
        } else if (classes[i] > 0) {
          rects.push(quads[i]);
        }
      }
    }
    iterCount += 1;
    if (iterCount > 10000) {
      throw new Error("Loop still running");
    }
  }
  return finalRects;
};

export default qtree;
