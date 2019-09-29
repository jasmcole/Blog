import { Primitive, isSphere } from "./primitives";

export default class WebGLRenderer {
  private vertex = `
  attribute vec3 position;
 
  void main() {

    gl_Position = vec4( position, 1.0 );

  }
`;

  private fragment = `
precision highp float;
uniform float time;
uniform float numPrim;
uniform float rotX;
uniform float rotY;
uniform vec2 resolution;
uniform vec2 textureSize;
uniform sampler2D textureSampler;

float unionSDF(float distA, float distB) {
  return min(distA, distB);
}

float sphere(vec3 pos, vec3 centre, float radius) {
  return length(pos - centre) - radius;
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float sdf(vec3 pos) {

  float globalMin = 1000.0;

  for (float i = 0.0; i < 1000.0; i++) {

    if (i == numPrim) {
      break;
    }

    float x = mod(i, textureSize.x);
    float y = floor(i / textureSize.x);

    float u = x / textureSize.x;
    float v = y / textureSize.y;

    vec4 texSample = texture2D(textureSampler, vec2(u, v));
    float radius = texSample.w * 5.;
    float thisMin = sphere(pos, 10. * (texSample.xyz - .5), radius);
    globalMin = smin(globalMin, thisMin, 0.5);

  }

  return globalMin;
}

vec4 rayMarch(vec3 start, vec3 direction) {
  float eps = 1e-5;
  vec3 pos = start;
  float dist = sdf(pos);
  float steps = 0.0;

  float maxDist = 11.0; // Quit after we are more than this distance away

  for (int i = 0; i < 40; i++) {

    float overshoot = dist < 0.1 ? 2.0 : 1.0;

    pos += overshoot * dist * direction;
    dist = sdf(pos);
    steps += 1.0;
    if(dist < eps || dist > maxDist) {
      break;
    }
  }
  return vec4(pos, steps);
}

vec3 normal(vec3 pos, float dist) {
  float eps = 1e-4;
  float dSDFdx = (sdf(vec3(pos.x + eps, pos.y, pos.z)) - dist);
  float dSDFdy = (sdf(vec3(pos.x, pos.y + eps, pos.z)) - dist);
  float dSDFdz = (sdf(vec3(pos.x, pos.y, pos.z + eps)) - dist);
  return normalize(vec3(dSDFdx, dSDFdy, dSDFdz));
}

mat3 rotationX(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat3(
    1.0, 0.0, 0.0,
    0.0,   c,  -s,
    0.0,   s,   c
  );
}

mat3 rotationY(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat3(
      c, 0.0,   s,
    0.0, 1.0, 0.0,
     -s, 0.0,   c
  );
}

void main() {

  // From -1 -> +1
  vec2 pos = 2. * (gl_FragCoord.xy / resolution.xy - 0.5);

  float l = 10.0;
  vec3 initialPos = vec3(0.0, 0.0, l);
  float aspect = resolution.x / resolution.y; // Large === landscape
  float fovX = 0.5; // Approx 26 degrees, like 50mm lens
  float fovY = fovX / aspect;
  float angleX = pos.x * fovX;
  float angleY = pos.y * fovY;
  vec3 dir = normalize(vec3(tan(angleX), tan(angleY), -1.0));

  mat3 rotXm = rotationX(rotX);
  mat3 rotYm = rotationY(rotY);
  mat3 rot = rotXm * rotYm;

  vec4 marchResult = rayMarch(rot * initialPos, rot * dir);
  vec3 marched = marchResult.xyz;
  float nSteps = marchResult.w;
  float dist = sdf(marched);
  vec3 n = normal(marched, dist);
  float red = dist < 1e-4 ? 0.4 + 0.3 * dot(n, rot * vec3(1.0, 1.0, 1.0)) : 1.0;
  float green = 1.2 - nSteps / 50.0;
  float blue = green;
  gl_FragColor = vec4(clamp(red, 0.0, 1.0), clamp(green, 0.0, 1.0), clamp(blue, 0.0, 1.0), 1.0);

}
`;

  private gl: WebGLRenderingContext | null = null;
  private currentProgram: WebGLProgram | null;
  private vertex_position: number;
  private timeLocation: WebGLUniformLocation | null;
  private resolutionLocation: WebGLUniformLocation | null;
  private textureSizeLocation: WebGLUniformLocation | null;
  private textureSamplerLocation: WebGLUniformLocation | null;
  private numPrimLocation: WebGLUniformLocation | null;
  private rotXLocation: WebGLUniformLocation | null;
  private rotYLocation: WebGLUniformLocation | null;
  private texture: WebGLTexture | null = null;
  private buffer: WebGLBuffer | null;
  private textureSize: [number, number] | null = null;
  private numPrim: number = 0;
  private rotX: number = 0;
  private rotY: number = 0;
  private parameters = {
    start_time: new Date().getTime(),
    time: 0,
    screenWidth: 512,
    screenHeight: 512
  };
  private frameTimes: number[] = [];
  private lastFrameTime: number = performance.now();

  public constructor(private reportFPS: (fps: number) => void) {}

  public begin(canvas: HTMLCanvasElement, primitives: Primitive[]) {
    this.init(canvas, primitives);
    if (this.gl && this.buffer) {
      this.animate();
    }
  }

  private init(canvas: HTMLCanvasElement, primtives: Primitive[]) {
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

    this.texture = this.gl.createTexture();
    if (!this.texture) {
      throw new Error("Failed to create texture");
    }

    const { circleData, textureWidth, textureHeight } = this.makeCircleData(
      primtives
    );
    this.updateTexture(textureWidth, textureHeight, circleData);

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

    // Create Program
    this.currentProgram = this.createProgram(this.vertex, this.fragment);
    if (!this.currentProgram) {
      console.error(this.gl.getError());
      throw Error("Cannot create WebGL program");
    }
    this.timeLocation = this.gl.getUniformLocation(this.currentProgram, "time");
    this.resolutionLocation = this.gl.getUniformLocation(
      this.currentProgram,
      "resolution"
    );
    this.textureSizeLocation = this.gl.getUniformLocation(
      this.currentProgram,
      "textureSize"
    );
    this.textureSamplerLocation = this.gl.getUniformLocation(
      this.currentProgram,
      "textureSampler"
    );
    this.numPrimLocation = this.gl.getUniformLocation(
      this.currentProgram,
      "numPrim"
    );
    this.rotXLocation = this.gl.getUniformLocation(this.currentProgram, "rotX");
    this.rotYLocation = this.gl.getUniformLocation(this.currentProgram, "rotY");
  }

  private makeCircleData(primitives: Primitive[]) {
    // Draw the first 128 * 128 elements ( = 16,384)
    const textureWidth = 128;
    const textureHeight = 128;
    const circleData = new Uint8Array(4 * (textureWidth * textureHeight));

    const circles = primitives.filter(isSphere);

    for (let i = 0; i < textureWidth * textureHeight * 4; i += 4) {
      if (i / 4 >= circles.length) {
        break;
      }
      circleData[i + 0] = 0.5 * (circles[i / 4].x + 1) * 255;
      circleData[i + 1] = 0.5 * (circles[i / 4].y + 1) * 255;
      circleData[i + 2] = 0.5 * (circles[i / 4].z + 1) * 255;
      circleData[i + 3] = circles[i / 4].r * 255;
    }
    this.textureSize = [textureWidth, textureHeight];
    this.numPrim = circles.length;
    return { circleData, textureWidth, textureHeight };
  }

  public updateCircles(primitives: Primitive[]) {
    const circles = primitives.filter(isSphere);
    const { circleData, textureWidth, textureHeight } = this.makeCircleData(
      circles
    );
    this.updateTexture(textureWidth, textureHeight, circleData);
    this.animate();
  }

  public updateRotation(angles: { x: number; y: number }) {
    this.rotX += angles.x;
    if (this.rotX > (0.8 * Math.PI) / 2) {
      this.rotX = (0.8 * Math.PI) / 2;
    }
    if (this.rotX < (-0.8 * Math.PI) / 2) {
      this.rotX = (-0.8 * Math.PI) / 2;
    }
    this.rotY += angles.y;
    this.animate();
  }

  private updateTexture(width: number, height: number, data: Uint8Array) {
    if (!this.gl) {
      return;
    }
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

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
    this.render();
    // requestAnimationFrame(() => this.animate(buffer));
  }

  private render() {
    if (!this.currentProgram || !this.gl || !this.textureSize) return;

    this.parameters.time = new Date().getTime() - this.parameters.start_time;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Load program into GPU

    this.gl.useProgram(this.currentProgram);

    this.gl.uniform1f(this.timeLocation, this.parameters.time / 1000);
    this.gl.uniform1f(this.numPrimLocation, this.numPrim);
    this.gl.uniform1f(this.rotXLocation, this.rotX);
    this.gl.uniform1f(this.rotYLocation, this.rotY);

    this.gl.uniform2f(
      this.resolutionLocation,
      this.parameters.screenWidth,
      this.parameters.screenHeight
    );

    this.gl.uniform2f(
      this.textureSizeLocation,
      this.textureSize[0],
      this.textureSize[1]
    );

    this.gl.activeTexture(this.gl.TEXTURE0);

    // Bind the texture to texture unit 0
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

    // Tell the shader we bound the texture to texture unit 0
    this.gl.uniform1i(this.textureSamplerLocation, 0);

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
