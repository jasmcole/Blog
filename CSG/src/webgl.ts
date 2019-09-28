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
uniform vec2 resolution;
uniform vec2 textureSize;
uniform sampler2D textureSampler;

float unionSDF(float distA, float distB) {
  return min(distA, distB);
}

float circle(vec2 pos, vec2 centre, float radius) {
  return length(pos - centre) - radius;
}

float sdf(vec2 pos) {

  float numCircles = textureSize.x * textureSize.y;

  float globalMin = 1000.0;

  float x = 0.0;
  float y = 0.0;

  for (float i = 0.0; i < 10000.0; i++) {
    if (i >= numCircles) {
      return globalMin;
    }

    float u = x / textureSize.x;
    float v = y / textureSize.y;

    vec4 texSample = texture2D(textureSampler, vec2(u, v));
    float radius = texSample.z;// * (1.5 + sin(5.0 * (5.0 * i / numCircles + time)));
    float thisMin = circle(pos, texSample.xy, radius);
    if (thisMin < globalMin) {
      globalMin = thisMin;
    }

    x += 1.0;

    if (x >= textureSize.x) {
      x = 0.0;
      y += 1.0;
    }

  }

  return globalMin;
}

void main() {

  // From 0 -> +1
  vec2 position = gl_FragCoord.xy / resolution.xy;

  float dist = sdf(position);
  float red = dist < 0.0 ? 1.0 : 0.0;

  gl_FragColor = vec4(red, red, red, 1.0);

}
`;

  private gl: WebGLRenderingContext | null = null;
  private currentProgram: WebGLProgram | null;
  private vertex_position: number;
  private timeLocation: WebGLUniformLocation | null;
  private resolutionLocation: WebGLUniformLocation | null;
  private textureSizeLocation: WebGLUniformLocation | null;
  private textureSamplerLocation: WebGLUniformLocation | null;
  private texture: WebGLTexture | null = null;
  private textureSize: [number, number] | null = null;
  private parameters = {
    start_time: new Date().getTime(),
    time: 0,
    screenWidth: 512,
    screenHeight: 512
  };

  public begin(
    canvas: HTMLCanvasElement,
    circles: Array<{ x: number; y: number; r: number }>
  ) {
    const { buffer } = this.init(canvas, circles);
    if (this.gl && buffer) {
      this.animate(buffer);
    }
  }

  private init(
    canvas: HTMLCanvasElement,
    circles: Array<{ x: number; y: number; r: number }>
  ) {
    this.gl = canvas.getContext("webgl");
    if (!this.gl) {
      throw Error("Cannot create WebGL context");
    }

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
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
      circles
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
    return { buffer };
  }

  private makeCircleData(circles: Array<{ x: number; y: number; r: number }>) {
    // Draw the first 128 * 128 elements ( = 16,384)
    const textureWidth = 128;
    const textureHeight = 128;
    const circleData = new Uint8Array(4 * (textureWidth * textureHeight));

    for (let i = 0; i < textureWidth * textureHeight * 4; i += 4) {
      if (i / 4 >= circles.length) {
        break;
      }
      circleData[i + 0] = circles[i / 4].x * 255;
      circleData[i + 1] = circles[i / 4].y * 255;
      circleData[i + 2] = circles[i / 4].r * 255;
      circleData[i + 3] = 0;
    }
    this.textureSize = [textureWidth, textureHeight];
    return { circleData, textureWidth, textureHeight };
  }

  public updateCircles(circles: Array<{ x: number; y: number; r: number }>) {
    const { circleData, textureWidth, textureHeight } = this.makeCircleData(
      circles
    );
    this.updateTexture(textureWidth, textureHeight, circleData);
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

  private animate(buffer: WebGLBuffer) {
    this.resizeCanvas(512, 512);
    this.render(buffer);
    requestAnimationFrame(() => this.animate(buffer));
  }

  private render(buffer: WebGLBuffer) {
    if (!this.currentProgram || !this.gl || !this.textureSize) return;

    this.parameters.time = new Date().getTime() - this.parameters.start_time;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Load program into GPU

    this.gl.useProgram(this.currentProgram);

    this.gl.uniform1f(this.timeLocation, this.parameters.time / 1000);
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

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
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
