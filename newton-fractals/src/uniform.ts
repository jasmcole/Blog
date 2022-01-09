type UniformBase = {
  name: string;
  location: WebGLUniformLocation | null;
};

interface UniformFloat extends UniformBase {
  value: number;
  type: 'float';
}

interface UniformInt extends UniformBase {
  value: number;
  type: 'int';
}

interface UniformVec2 extends UniformBase {
  value: [number, number];
  type: 'vec2';
}

interface UniformTextureSampler extends UniformBase {
  value: number;
  type: 'sampler2D';
}

export type Uniform =
  | UniformFloat
  | UniformInt
  | UniformVec2
  | UniformTextureSampler;

export type UValues<T extends Uniform['type']> = T extends 'float' | 'int'
  ? number
  : T extends 'vec2'
  ? [number, number]
  : T extends 'textureSampler'
  ? number
  : never;
