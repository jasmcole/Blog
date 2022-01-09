import fragment from './fragment';
import vertex from './vertex';
import { Uniform, UValues } from './uniform';

export default class WebGLRenderer {
  private uniforms: Uniform[] = [
    {
      name: 'time',
      value: 0,
      location: null,
      type: 'float',
    },
    {
      name: 'resolution',
      value: [512, 512],
      location: null,
      type: 'vec2',
    },
    {
      name: 'xLims',
      value: [-1, 1],
      location: null,
      type: 'vec2',
    },
    {
      name: 'yLims',
      value: [-1, 1],
      location: null,
      type: 'vec2',
    },
    {
      name: 'grid',
      value: 1,
      location: null,
      type: 'float',
    },
    {
      name: 'roots',
      value: 1,
      location: null,
      type: 'float',
    },
    {
      name: 'root1',
      value: [1, 0],
      location: null,
      type: 'vec2',
    },
    {
      name: 'root2',
      value: [-1 / 2, Math.sqrt(3) / 2],
      location: null,
      type: 'vec2',
    },
    {
      name: 'root3',
      value: [-1 / 2, -Math.sqrt(3) / 2],
      location: null,
      type: 'vec2',
    },
    {
      name: 'nIter',
      value: 100,
      location: null,
      type: 'int',
    },
    {
      name: 'dpr',
      value: window.devicePixelRatio,
      location: null,
      type: 'float',
    },
    {
      name: 'auto',
      value: 0,
      location: null,
      type: 'float',
    },
  ];

  private gl: WebGLRenderingContext | null = null;
  private currentProgram: WebGLProgram | null;
  private vertex_position: number;
  private didInit = false;

  private buffer: WebGLBuffer | null;

  private startTime = new Date().getTime();
  private frameTimes: number[] = [];
  private lastFrameTime: number = performance.now();

  public constructor(
    private canvas: HTMLCanvasElement,
    private reportFPS?: (fps: number) => void,
  ) {}

  public begin() {
    this.init();
    if (this.gl && this.buffer) {
      const bounds = this.canvas.getBoundingClientRect();
      this.resizeCanvas(
        bounds.width * window.devicePixelRatio,
        bounds.height * window.devicePixelRatio,
      );
      this.render();
    }
  }

  public assignUniformValue<T extends Uniform['type']>(
    name: string,
    type: T,
    value: UValues<T>,
  ) {
    const uniform = this.uniforms.find(u => u.name === name);
    if (!uniform || uniform.type !== type) {
      return;
    }
    uniform.value = value;
  }

  public getUniformValue<T extends Uniform['type']>(
    name: string,
    type: T,
  ): UValues<T> {
    const uniform = this.uniforms.find(u => u.name === name);
    if (!uniform || uniform.type !== type) {
      throw new Error(`Missing uniform ${name}`);
    }
    return uniform.value as UValues<T>;
  }

  private assignUniformLocation(
    name: string,
    location: WebGLUniformLocation | null,
  ) {
    const uniform = this.uniforms.find(u => u.name === name);
    if (!uniform) {
      return;
    }
    uniform.location = location;
  }

  private init() {
    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) {
      throw Error('Cannot create WebGL context');
    }

    this.buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
      ]),
      this.gl.STATIC_DRAW,
    );

    // Create Program
    this.currentProgram = this.createProgram(vertex, fragment(this.uniforms));
    if (!this.currentProgram) {
      console.error(this.gl.getError());
      throw Error('Cannot create WebGL program');
    }

    for (const uniform of this.uniforms) {
      const location = this.gl.getUniformLocation(
        this.currentProgram,
        uniform.name,
      );
      this.assignUniformLocation(uniform.name, location);
    }
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
      | WebGLRenderingContextBase['VERTEX_SHADER']
      | WebGLRenderingContextBase['FRAGMENT_SHADER'],
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

  public resizeCanvas(width: number, height: number) {
    if (!this.gl) return;
    this.gl.viewport(0, 0, width, height);
    this.assignUniformValue('resolution', 'vec2', [width, height]);
    const r = 2;
    this.assignUniformValue('xLims', 'vec2', [-r, r]);
    const aspect = height / width;
    this.assignUniformValue('yLims', 'vec2', [-r * aspect, r * aspect]);
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
        0,
      );
    this.reportFPS?.(fps);
  }

  public render(force?: boolean) {
    if (
      !this.currentProgram ||
      !this.gl ||
      (!force && this.getUniformValue('auto', 'float') > 0)
    ) {
      return;
    }

    this.calcFPS();

    this.assignUniformValue(
      'time',
      'float',
      (new Date().getTime() - this.startTime) / 1000,
    );

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.useProgram(this.currentProgram);

    for (const uniform of this.uniforms) {
      switch (uniform.type) {
        case 'float': {
          this.gl.uniform1f(uniform.location, uniform.value);
          break;
        }
        case 'int': {
          this.gl.uniform1i(uniform.location, uniform.value);
          break;
        }
        case 'sampler2D': {
          this.gl.uniform1i(uniform.location, uniform.value);
          break;
        }
        case 'vec2': {
          this.gl.uniform2f(
            uniform.location,
            uniform.value[0],
            uniform.value[1],
          );
          break;
        }
      }
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.vertexAttribPointer(
      this.vertex_position,
      2,
      this.gl.FLOAT,
      false,
      0,
      0,
    );
    this.gl.enableVertexAttribArray(this.vertex_position);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    this.gl.disableVertexAttribArray(this.vertex_position);

    if (!this.didInit) {
      this.didInit = true;
      requestAnimationFrame(() => this.render());
    }

    if (this.getUniformValue('auto', 'float') > 0) {
      requestAnimationFrame(() => this.render(true));
    }
  }
}
