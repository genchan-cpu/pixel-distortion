export const vertexShader = /* glsl */`
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const fragmentShader = /* glsl */`
  uniform sampler2D uTexture;
  uniform sampler2D uDataTexture;
  uniform vec2 uTextureResolution;
  uniform vec2 uResolution;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 ratio = vec2(
      min((uResolution.x / uResolution.y) / (uTextureResolution.x / uTextureResolution.y), 1.0),
      min((uResolution.y / uResolution.x) / (uTextureResolution.y / uTextureResolution.x), 1.0)
    );

    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    vec4 offset = texture2D(uDataTexture, uv);

    float r = texture2D(uTexture, uv - 0.02 * offset.rg).r;
    float g = texture2D(uTexture, uv - 0.015 * offset.rg).g;
    float b = texture2D(uTexture, uv - 0.01 * offset.rg).b;

    gl_FragColor = vec4(r, g, b, 1.0);
  }
`
