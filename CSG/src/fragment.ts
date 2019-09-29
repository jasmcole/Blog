import { Uniform } from "./webgl";

const fragment = (uniforms: Uniform[]) => `
precision lowp float;

${uniforms.reduce(
  (acc, curr) => (acc += `uniform ${curr.type} ${curr.name};\n`),
  ""
)}

float unionSDF(float distA, float distB) {
  return min(distA, distB);
}

float sphere(vec3 pos, vec3 centre, float radius) {
  return length(pos - centre) - radius;
}

float box(vec3 pos, vec3 centre, vec3 radius) {
  vec3 d = abs(pos - centre) - radius;
  return length(max(d,0.0)) - 0.1 // Rounding
         + min(max(d.x,max(d.y,d.z)),0.0); // remove this line for an only partially signed sdf 
}

float softMin( float a, float b, float k ) {
    //float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    //return mix( b, a, h ) - k*h*(1.0-h);
    return min(a, b);
}

float convertPos(float pos) {
  return 8. * (pos - .5);
}

float convertRad(float rad) {
  return 4. * rad;
}

float sdf(vec3 pos) {

  float xyMin = 1000.0;
  float yzMin = 1000.0;
  float xzMin = 1000.0;

  for (float i = 0.0; i < 10000.0; i++) {

    if (i == numPrimXY) {
      break;
    }

    float x = mod(i, textureSize.x);
    float y = floor(i / textureSize.x);

    float u = x / textureSize.x;
    float v = y / textureSize.y;

    vec4 texSample = texture2D(textureSamplerXY, vec2(u, v));

    // For boxes - extruded in z
    vec3 boxCentre = vec3(convertPos(texSample.x), convertPos(texSample.y), 0.0);
    vec3 boxRadius = vec3(convertRad(texSample.z), convertRad(texSample.w), 5.0);
    float thisMin = box(pos, boxCentre, boxRadius);

    xyMin = softMin(xyMin, thisMin, 0.1);

  }

  for (float i = 0.0; i < 10000.0; i++) {

    if (i == numPrimYZ) {
      break;
    }

    float x = mod(i, textureSize.x);
    float y = floor(i / textureSize.x);

    float u = x / textureSize.x;
    float v = y / textureSize.y;

    vec4 texSample = texture2D(textureSamplerYZ, vec2(u, v));

    // Extruded in x
    vec3 boxCentre = vec3(0.0, convertPos(texSample.y), convertPos(texSample.x));
    vec3 boxRadius = vec3(5.0, convertRad(texSample.w), convertRad(texSample.z));
    float thisMin = box(pos, boxCentre, boxRadius);

    yzMin = softMin(yzMin, thisMin, 0.1);

  }

  for (float i = 0.0; i < 10000.0; i++) {

    if (i == numPrimXZ) {
      break;
    }

    float x = mod(i, textureSize.x);
    float y = floor(i / textureSize.x);

    float u = x / textureSize.x;
    float v = y / textureSize.y;

    vec4 texSample = texture2D(textureSamplerXZ, vec2(u, v));

    // Extruded in y
    vec3 boxCentre = vec3(convertPos(texSample.y), 0.0, convertPos(texSample.x));
    vec3 boxRadius = vec3(convertRad(texSample.w), 5.0, convertRad(texSample.z));
    float thisMin = box(pos, boxCentre, boxRadius);

    xzMin = softMin(xzMin, thisMin, 0.1);

  }

  // float globalMax = max(max(xyMin, yzMin), xzMin);
  float globalMax = min(min(xyMin, yzMin), xzMin);

  return globalMax;
}

vec4 rayMarch(vec3 start, vec3 direction) {
  float eps = 1e-4;
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
  gl_FragColor = vec4(red, green, green, 1.0);

}
`;

export default fragment;
