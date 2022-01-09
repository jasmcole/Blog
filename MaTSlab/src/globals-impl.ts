export class Vec {
  constructor(public readonly arr: number[]) {}

  get length() {
    return this.arr.length;
  }

  public add(num: number | Vec): Vec {
    return this.binary(num, (a, b) => a + b);
  }

  public sub(num: number | Vec): Vec {
    return this.binary(num, (a, b) => a - b);
  }

  public mul(num: number | Vec): Vec {
    return this.binary(num, (a, b) => a * b);
  }

  public div(num: number | Vec): Vec {
    return this.binary(num, (a, b) => a / b);
  }

  public map(m: (value: number, index: number) => number): Vec {
    return new Vec(this.arr.map(m));
  }

  private binary(arg: number | Vec, op: (a: number, b: number) => number): Vec {
    if (arg instanceof Vec) {
      if (this.length !== arg.length) {
        throw new Error(`Lengths not equal: ${this.length} !== ${arg.length}`);
      }
      return new Vec(this.arr.map((x, i) => op(x, arg.arr[i])));
    }
    return new Vec(this.arr.map(x => op(x, arg)));
  }
}

export class Mat {
  constructor(public readonly arr: number[][]) {}

  get size() {
    return [this.arr.length, this.arr[0].length];
  }

  public add(num: number | Mat): Mat {
    return this.binary(num, (a, b) => a + b);
  }

  public sub(num: number | Mat): Mat {
    return this.binary(num, (a, b) => a - b);
  }

  public mul(num: number | Mat): Mat {
    return this.binary(num, (a, b) => a * b);
  }

  public div(num: number | Mat): Mat {
    return this.binary(num, (a, b) => a / b);
  }

  public map(m: (value: number, i: number, j: number) => number): Mat {
    return new Mat(this.arr.map((x, i) => x.map((xx, j) => m(xx, i, j))));
  }

  private binary(arg: number | Mat, op: (a: number, b: number) => number): Mat {
    if (arg instanceof Mat) {
      if (this.size[0] !== arg.size[0]) {
        throw new Error(
          `First dimensions not equal: ${this.size[0]} !== ${arg.size[0]}`,
        );
      }
      if (this.size[1] !== arg.size[1]) {
        throw new Error(
          `Second dimensions not equal: ${this.size[1]} !== ${arg.size[1]}`,
        );
      }
      return new Mat(
        this.arr.map((x, i) => x.map((xx, j) => op(xx, arg.arr[i][j]))),
      );
    }
    return new Mat(this.arr.map(x => x.map(xx => op(xx, arg))));
  }
}

export const linspace = (start: number, stop: number, step: number): Vec => {
  const out: number[] = [start];
  if (step <= 0) {
    throw new Error('Require step > 0');
  }
  while (out[out.length - 1] + step <= stop) {
    out.push(out[out.length - 1] + step);
  }

  return new Vec(out);
};

export const meshgrid = (x: Vec, y: Vec): [Mat, Mat] => {
  const nx = x.length;
  const ny = y.length;

  const xg = new Array(ny).fill(0).map(() => new Array(nx).fill(0));
  const yg = new Array(ny).fill(0).map(() => new Array(nx).fill(0));

  for (let i = 0; i < ny; i++) {
    for (let j = 0; j < nx; j++) {
      xg[i][j] = x.arr[j];
      yg[i][j] = y.arr[i];
    }
  }

  return [new Mat(xg), new Mat(yg)];
};

export const zeros_like = (x: Mat): Mat => {
  const [nx, ny] = x.size;

  return new Mat(new Array(nx).fill(0).map(() => new Array(ny).fill(0)));
};

export const openFile = (): Promise<ArrayBuffer> => {
  return new Promise<ArrayBuffer>(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.addEventListener('change', (e: any) => {
      const reader = new FileReader();
      reader.addEventListener('load', (loadEvent: any) => {
        resolve(loadEvent.target.result);
      });
      reader.readAsArrayBuffer(e.target.files[0]);
    });
    input.click();
  });
};

const applyFunc = (f: (v: number) => number) => (vec: VecOrArray): Vec => {
  const arr = Array.isArray(vec) ? vec : vec.arr;
  return new Vec((arr || []).map(x => f(x)));
};

export const sin = applyFunc(Math.sin);
export const cos = applyFunc(Math.cos);
export const tan = applyFunc(Math.tan);
export const exp = applyFunc(Math.exp);
export const pow = (vec: VecOrArray, power: number) =>
  applyFunc(v => Math.pow(v, power))(vec);
