// Angle and Trigonometry
const float PI = 3.141592653589793;

float radians(float degrees) {
  return PI / 180.0 * degrees;
}

float degrees(float radians) {
  return 180.0 / PI * radians;
}

float sin(float x);
float cos(float x);
float tan(float x);
float asin(float x);
float acos(float x);
float atan(float x);

// sin, cos, tan, asin, acos, atan, atan

// Exponential Functions
// pow, exp, log, exp2, log2, sqrt, inversesqrt
float sqrt(float x) {
  return 0.0; // use JS sqrt
}

// Common Functions
float abs(float x) {
  return x >= 0.0 ? x : -x;
}

float sign(float x) {
  return x > 0.0 ? 1.0 : x == 0.0 ? 0.0 : -1.0;
}

float floor(float x) {
  return float(int(x));
}

// ceil

float fract(float x) {
  return x - floor(x);
}

float mod(float x, float y) {
  return x - y * floor(x / y); // TODO: use JS mod directly??
}

// mod2

float min(float x, float y) {
  return y < x ? y : x;
}

// min2

float max(float x, float y) {
  return x < y ? y : x;
}

// max2

float clamp(float x, float min, float max) {
  return min(max(x, min), max);
}

float mix(float x, float y, float a) {
  return x * (1.0 - a) + y * a;
}

// mix2

float step(float edge, float x) {
  return x < edge ? 0.0 : 1.0;
}

// step2

float smoothstep(float edge0, float edge1, float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

// Geometric Functions
float length(vec2 x) {
  return sqrt(x.x * x.x + x.y * x.y);
}

float distance(vec2 p0, vec2 p1) {
  return length(p0 - p1);
}

// dopt, cross, normalize, faceforward, reflect, refract

// Matrix functions
// matrixCompMult, 

// Vector Relational Functions
bvec2 lessThan(vec2 x, vec2 y) {
  return bvec2(x.x < y.x, x.y < y.y);
}

bvec2 lessThanEqual(vec2 x, vec2 y) {
  return bvec2(x.x <= y.x, x.y <= y.y);
}

bvec2 greaterThan(vec2 x, vec2 y) {
  return bvec2(x.x > y.x, x.y > y.y);
}

bvec2 greaterThanEqual(vec2 x, vec2 y) {
  return bvec2(x.x >= y.x, x.y >= y.y);
}

bvec2 equal(vec2 x, vec2 y) {
  return bvec2(x.x == y.x, x.y == y.y);
}

bvec2 notEqual(vec2 x, vec2 y) {
  return bvec2(x.x != y.x, x.y != y.y);
}

bool any(bvec2 x) {
  return x.x || x.y;
}

bool all(bvec2 x) {
  return x.x && x.y;
}

bvec2 not(bvec2 x) {
  return bvec2(!x.x, !x.y);
}

// Texture Lookup Functions
// texture2D, texture2DProj, texture2DProgLod, textureCube, textureCubeLod