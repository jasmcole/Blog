import { Primitive, isBox } from "./primitives";
import fragment from "./fragment";
import vertex from "./vertex";

type UniformBase = {
  name: string;
  location: WebGLUniformLocation | null;
};

interface UniformFloat extends UniformBase {
  value: number;
  type: "float";
}

interface UniformVec2 extends UniformBase {
  value: [number, number];
  type: "vec2";
}

interface UniformTextureSampler extends UniformBase {
  value: number;
  type: "sampler2D";
}

export type Uniform = UniformFloat | UniformVec2 | UniformTextureSampler;

type UValues<T extends Uniform["type"]> = T extends "float"
  ? number
  : T extends "vec2"
  ? [number, number]
  : T extends "textureSampler"
  ? number
  : never;

export default class WebGLRenderer {
  private uniforms: Uniform[] = [
    {
      name: "time",
      value: 0,
      location: null,
      type: "float"
    },
    {
      name: "resolution",
      value: [512, 512],
      location: null,
      type: "vec2"
    },
    {
      name: "textureSize",
      value: [128, 128],
      location: null,
      type: "vec2"
    },
    {
      name: "numPrimXY",
      value: 0,
      location: null,
      type: "float"
    },
    {
      name: "numPrimYZ",
      value: 0,
      location: null,
      type: "float"
    },
    {
      name: "numPrimXZ",
      value: 0,
      location: null,
      type: "float"
    },
    {
      name: "l",
      value: 10,
      location: null,
      type: "float"
    },
    {
      name: "rotX",
      value: 0,
      location: null,
      type: "float"
    },
    {
      name: "rotY",
      value: 0,
      location: null,
      type: "float"
    },
    {
      name: "textureSamplerXY",
      value: 0,
      location: null,
      type: "sampler2D"
    },
    {
      name: "textureSamplerYZ",
      value: 1,
      location: null,
      type: "sampler2D"
    },
    {
      name: "textureSamplerXZ",
      value: 2,
      location: null,
      type: "sampler2D"
    },
    {
      name: "intersect",
      value: 0,
      location: null,
      type: "float"
    },
    {
      name: "numSteps",
      value: 1,
      location: null,
      type: "float"
    }
  ];

  private gl: WebGLRenderingContext | null = null;
  private currentProgram: WebGLProgram | null;
  private vertex_position: number;

  private textureXY: WebGLTexture | null = null;
  private textureYZ: WebGLTexture | null = null;
  private textureXZ: WebGLTexture | null = null;

  private buffer: WebGLBuffer | null;

  private startTime = new Date().getTime();
  private frameTimes: number[] = [];
  private lastFrameTime: number = performance.now();

  public constructor(private reportFPS: (fps: number) => void) {}

  public begin(
    canvas: HTMLCanvasElement,
    primitives: { XY: Primitive[]; YZ: Primitive[]; XZ: Primitive[] }
  ) {
    this.init(canvas, primitives);
    if (this.gl && this.buffer) {
      this.animate();
    }
  }

  private createTexture(primitives: Primitive[]) {
    if (!this.gl) {
      throw new Error("No WebGL context");
    }
    const texture = this.gl.createTexture();

    if (!texture) {
      throw new Error("Failed to create textures");
    }

    const { boxData, textureWidth, textureHeight, numPrim } = this.makeBoxData(
      primitives
    );
    this.updateTexture(textureWidth, textureHeight, boxData, texture);

    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE
    );
    return { texture, numPrim };
  }

  public assignUniformValueAndUpdate<T extends Uniform["type"]>(
    name: string,
    type: T,
    value: UValues<T>
  ) {
    this.assignUniformValue(name, type, value);
    this.animate();
  }
  private assignUniformValue<T extends Uniform["type"]>(
    name: string,
    type: T,
    value: UValues<T>
  ) {
    const uniform = this.uniforms.find(u => u.name === name);
    if (!uniform || uniform.type !== type) {
      return;
    }
    uniform.value = value;
  }

  private assignUniformLocation(
    name: string,
    location: WebGLUniformLocation | null
  ) {
    const uniform = this.uniforms.find(u => u.name === name);
    if (!uniform) {
      return;
    }
    uniform.location = location;
  }

  private getUniformValue<T extends Uniform["type"]>(name: string, type: T) {
    const uniform = this.uniforms.find(u => u.name === name && u.type === type);
    if (!uniform) {
      throw new Error(`Missing uniform ${name}`);
    }
    return uniform.value as UValues<T>;
  }

  private init(
    canvas: HTMLCanvasElement,
    primitives: { XY: Primitive[]; YZ: Primitive[]; XZ: Primitive[] }
  ) {
    this.gl = canvas.getContext("webgl");
    if (!this.gl) {
      throw Error("Cannot create WebGL context");
    }

    this.buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0,
        -1.0,
        1.0,
        -1.0,
        -1.0,
        1.0,
        1.0,
        -1.0,
        1.0,
        1.0,
        -1.0,
        1.0
      ]),
      this.gl.STATIC_DRAW
    );

    const { texture: textureXY, numPrim: numPrimXY } = this.createTexture(
      primitives.XY
    );
    const { texture: textureYZ, numPrim: numPrimYZ } = this.createTexture(
      primitives.YZ
    );
    const { texture: textureXZ, numPrim: numPrimXZ } = this.createTexture(
      primitives.XZ
    );
    this.textureXY = textureXY;
    this.textureYZ = textureYZ;
    this.textureXZ = textureXZ;
    this.assignUniformValue("numPrimXY", "float", numPrimXY);
    this.assignUniformValue("numPrimYZ", "float", numPrimYZ);
    this.assignUniformValue("numPrimXZ", "float", numPrimXZ);

    // Create Program
    this.currentProgram = this.createProgram(vertex, fragment(this.uniforms));
    if (!this.currentProgram) {
      console.error(this.gl.getError());
      throw Error("Cannot create WebGL program");
    }

    for (const uniform of this.uniforms) {
      const location = this.gl.getUniformLocation(
        this.currentProgram,
        uniform.name
      );
      this.assignUniformLocation(uniform.name, location);
    }
  }

  private makeBoxData(primitives: Primitive[]) {
    // Draw the first 128 * 128 elements ( = 16,384)
    const [textureWidth, textureHeight] = this.getUniformValue(
      "textureSize",
      "vec2"
    );
    const boxData = new Uint8Array(4 * (textureWidth * textureHeight));

    const boxes = primitives.filter(isBox);

    for (let i = 0; i < textureWidth * textureHeight * 4; i += 4) {
      if (i / 4 >= boxes.length) {
        break;
      }
      boxData[i + 0] = 0.5 * (boxes[i / 4].x + 1) * 255;
      boxData[i + 1] = 0.5 * (boxes[i / 4].y + 1) * 255;
      boxData[i + 2] = boxes[i / 4].w * 255;
      boxData[i + 3] = boxes[i / 4].h * 255;
    }
    const numPrim = boxes.length;
    return { boxData, textureWidth, textureHeight, numPrim };
  }

  public updateBoxesXY(primitives: Primitive[]) {
    const texture = this.textureXY;
    const boxes = primitives.filter(isBox);
    const { boxData, textureWidth, textureHeight, numPrim } = this.makeBoxData(
      boxes
    );
    this.assignUniformValue("numPrimXY", "float", numPrim);
    this.updateTexture(textureWidth, textureHeight, boxData, texture);
    this.animate();
  }

  public updateBoxesYZ(primitives: Primitive[]) {
    const texture = this.textureYZ;
    const boxes = primitives.filter(isBox);
    const { boxData, textureWidth, textureHeight, numPrim } = this.makeBoxData(
      boxes
    );
    this.assignUniformValue("numPrimYZ", "float", numPrim);
    this.updateTexture(textureWidth, textureHeight, boxData, texture);
    this.animate();
  }

  public updateBoxesXZ(primitives: Primitive[]) {
    const texture = this.textureXZ;
    const boxes = primitives.filter(isBox);
    const { boxData, textureWidth, textureHeight, numPrim } = this.makeBoxData(
      boxes
    );
    this.assignUniformValue("numPrimXZ", "float", numPrim);
    this.updateTexture(textureWidth, textureHeight, boxData, texture);
    this.animate();
  }

  public updateRotation(angles: { x: number; y: number }) {
    this.assignUniformValue(
      "rotX",
      "float",
      this.getUniformValue("rotX", "float") + angles.x
    );
    this.assignUniformValue(
      "rotY",
      "float",
      this.getUniformValue("rotY", "float") + angles.y
    );
    this.animate();
  }

  public setRotation(angles: { x: number; y: number }) {
    this.assignUniformValue("rotX", "float", angles.x);
    this.assignUniformValue("rotY", "float", angles.y);
    this.animate();
  }

  public updateZoom(dl: number) {
    this.assignUniformValue(
      "l",
      "float",
      this.getUniformValue("l", "float") * (1 + dl)
    );
    this.animate();
  }

  private updateTexture(
    width: number,
    height: number,
    data: Uint8Array,
    texture: WebGLTexture | null
  ) {
    if (!this.gl || !texture) {
      return;
    }
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = this.gl.RGBA;
    const border = 0;
    const srcFormat = this.gl.RGBA;
    const srcType = this.gl.UNSIGNED_BYTE;
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      data
    );
  }

  private createProgram(vertex: string, fragment: string) {
    if (!this.gl) {
      return null;
    }
    const program = this.gl.createProgram();

    if (program === null) {
      return null;
    }

    const vs = this.createShader(vertex, this.gl.VERTEX_SHADER);
    const fs = this.createShader(fragment, this.gl.FRAGMENT_SHADER);

    if (vs === null || fs === null) return null;

    this.gl.attachShader(program, vs);
    this.gl.attachShader(program, fs);

    this.gl.deleteShader(vs);
    this.gl.deleteShader(fs);

    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      return null;
    }

    return program;
  }

  private createShader(
    src: string,
    type:
      | WebGLRenderingContextBase["VERTEX_SHADER"]
      | WebGLRenderingContextBase["FRAGMENT_SHADER"]
  ) {
    if (!this.gl) {
      return null;
    }
    const shader = this.gl.createShader(type);

    if (!shader) {
      return null;
    }

    this.gl.shaderSource(shader, src);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const compilationLog = this.gl.getShaderInfoLog(shader);
      console.warn(compilationLog);
      return null;
    }

    return shader;
  }

  private resizeCanvas(width: number, height: number) {
    if (!this.gl) return;
    this.gl.viewport(0, 0, width, height);
  }

  private calcFPS() {
    const newFrameTime = performance.now();
    const oldFrameTime = this.lastFrameTime;
    this.frameTimes.push(newFrameTime - oldFrameTime);
    if (this.frameTimes.length > 20) {
      this.frameTimes.shift();
    }
    this.lastFrameTime = newFrameTime;
    const fps =
      1000 /
      this.frameTimes.reduce(
        (acc, curr) => (acc += curr / this.frameTimes.length),
        0
      );
    this.reportFPS(fps);
  }

  private animate() {
    this.calcFPS();
    this.resizeCanvas(512, 512);
    requestAnimationFrame(() => this.render());
    // requestAnimationFrame(() => this.animate(buffer));
  }

  private render() {
    if (!this.currentProgram || !this.gl) return;

    this.assignUniformValue(
      "time",
      "float",
      (new Date().getTime() - this.startTime) / 1000
    );

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.useProgram(this.currentProgram);

    for (const uniform of this.uniforms) {
      switch (uniform.type) {
        case "float": {
          this.gl.uniform1f(uniform.location, uniform.value);
          break;
        }
        case "sampler2D": {
          this.gl.uniform1i(uniform.location, uniform.value);
          break;
        }
        case "vec2": {
          this.gl.uniform2f(
            uniform.location,
            uniform.value[0],
            uniform.value[1]
          );
          break;
        }
      }
    }

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textureXY);

    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textureYZ);

    this.gl.activeTexture(this.gl.TEXTURE2);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textureXZ);

    // Render geometry

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.vertexAttribPointer(
      this.vertex_position,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.enableVertexAttribArray(this.vertex_position);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    this.gl.disableVertexAttribArray(this.vertex_position);
  }
}
