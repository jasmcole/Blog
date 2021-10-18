import { Uniform } from './uniform';

const fragment = (uniforms: Uniform[]) => `
precision highp float;

${uniforms.reduce(
  (acc, curr) => (acc += `uniform ${curr.type} ${curr.name};\n`),
  '',
)}

vec2 mul(vec2 a, vec2 b) {
  float x = a.x * b.x - a.y * b.y;
  float y = a.x * b.y + a.y * b.x;
  return vec2(x, y);
}

// returns a / b
vec2 div(vec2 a, vec2 b) {
  float x = a.x * b.x + a.y * b.y;
  float y = a.y * b.x - a.x * b.y;
  float denom = (b.x * b.x + b.y * b.y);
  return vec2(x / denom, y / denom);
}

// One Newton-Raphson iteration step
vec2 iteration(vec2 z, vec2 r1, vec2 r2, vec2 r3) {
  vec2 one = z - r1;
  vec2 two = z - r2;
  vec2 three = z - r3;

  return z - div(mul(mul(one, two), three), mul(two, three) + mul(one, three) + mul(one, two));
}

float pi = 3.1415926;

void main() {

  // Between 0 and 1
  vec2 pos =  (gl_FragCoord.xy / resolution.xy);

  // In bounds defined by xLims / yLims
  float x = xLims.x + pos.x * (xLims.y - xLims.x);
  float y = yLims.x + pos.y * (yLims.y - yLims.x);

  float onePx = (xLims.y - xLims.x) / resolution.x;

  vec4 rgba = vec4(0.0, 0.0, 0.0, 0.0);

  vec2 r1 = auto > 0.0 ? 1.2 * vec2(cos(time * 0.385 + 3.21), sin(time)) : root1;
  vec2 r2 = auto > 0.0 ? 0.6 * vec2(cos(time * 0.583 + 1.21), sin(time)) : root2;
  vec2 r3 = auto > 0.0 ? 0.8 * vec2(cos(time * 0.853 + 2.21), sin(time)) : root3;

  vec2 iterate = vec2(x, y);
  for (int i = 0; i < 100; i++) {
    iterate = iteration(iterate, r1, r2, r3);
    if (i > nIter) {
      break;
    }
  }

  float len1 = length(iterate - r1);
  float len2 = length(iterate - r2);
  float len3 = length(iterate - r3);

  // https://coolors.co/29bf12-abff4f-08bdbd-f21b3f-ff9914
  vec3 kellygreen = vec3(41.0, 191.0, 18.0) / 256.0;
  vec3 frenchlime = vec3(171.0, 255.0, 79.0) / 256.0;
  vec3 maximumbluegreen = vec3(8.0, 189.0, 189.0) / 256.0;
  vec3 redmunsell = vec3(242.0, 27.0, 63.0) / 256.0;
  vec3 yelloworangecolorwheel = vec3(255.0, 153.0, 20.0) / 256.0;

  vec3 col1 = kellygreen;
  vec3 col2 = redmunsell;
  vec3 col3 = maximumbluegreen;

  float coeff1 = pow(1.01 / (1.0 + len1), 10.0);
  float coeff2 = pow(1.01 / (1.0 + len2), 10.0);
  float coeff3 = pow(1.01 / (1.0 + len3), 10.0);

  rgba += vec4(coeff1 * col1 + coeff2 * col2 + coeff3 * col3, 1.0);

  float majorGap = pow(10.0, floor(log(xLims.y - xLims.x) / log(10.0)));
  float minorGap = majorGap / 10.0;

  if (grid > 0.0) {
    // Minor gridlines
    if (abs(mod(x, minorGap)) < onePx) {
      rgba = mix(rgba, vec4(1.0, 1.0, 1.0, 0.8), 0.2);
    }
    
    if (abs(mod(y, minorGap)) < onePx) {
      rgba = mix(rgba, vec4(1.0, 1.0, 1.0, 0.8), 0.2);
    }
    
    // Major gridlines
    if (abs(mod(x, majorGap)) < 2.0 * onePx) {
      rgba = mix(rgba, vec4(1.0, 1.0, 1.0, 0.8), 0.4);
    }
    
    if (abs(mod(y, majorGap)) < 2.0 * onePx) {
      rgba = mix(rgba, vec4(1.0, 1.0, 1.0, 0.8), 0.4);
    }
  }

  if (roots > 0.0) {
    // Roots - smmothstep for antialiasing
    float rootRad = 10.0 * onePx * dpr;
    float r1Dist = length(vec2(x, y) - r1);
    float r2Dist = length(vec2(x, y) - r2);
    float r3Dist = length(vec2(x, y) - r3);
    
    if (r1Dist < rootRad) {
      rgba = mix(rgba, vec4(1.0, 0.0, 0.0, 0.8), smoothstep(1.0, 0.8, r1Dist / rootRad));
    }
    if (r2Dist < rootRad) {
      rgba = mix(rgba, vec4(0.0, 1.0, 0.0, 0.8), smoothstep(1.0, 0.8, r2Dist / rootRad));
    }
    if (r3Dist < rootRad) {
      rgba = mix(rgba, vec4(0.0, 0.0, 1.0, 0.8), smoothstep(1.0, 0.8, r3Dist / rootRad));
    }
  }

  gl_FragColor = rgba;

}
`;

export default fragment;
