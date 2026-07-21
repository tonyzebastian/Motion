import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

type DitherBackgroundProps = {
  readonly backgroundColor: string;
  readonly patternColor: string;
  readonly patternOpacity: number;
};

const vertexShader = `
  precision highp float;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float uAspect;
  uniform float uOpacity;
  uniform float uTime;
  uniform vec3 uPatternColor;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    mat2 rotation = mat2(0.82, -0.57, 0.57, 0.82);

    for (int i = 0; i < 6; i++) {
      value += amplitude * valueNoise(p);
      p = rotation * p * 2.03 + vec2(19.1, 7.7);
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 p = vUv - 0.5;
    p.x *= uAspect;
    p *= 2.1;
    p += vec2(uTime * 0.06, -uTime * 0.045);

    float firstWarp = fbm(p + vec2(0.0, uTime * 0.03));
    float secondWarp = fbm(
      p + vec2(4.7, 2.3) + firstWarp * 1.35 - vec2(uTime * 0.025, 0.0)
    );
    float field = fbm(p + vec2(firstWarp, secondWarp) * 2.15);
    field = smoothstep(0.25, 0.82, field);
    vec2 centerUv = vUv - 0.5;
    centerUv.x *= uAspect;
    float centerPresence =
      1.0 - smoothstep(0.05, 0.5, length(centerUv));
    float topLeftPresence =
      1.0 - smoothstep(0.08, 0.9, length(vUv - vec2(0.0, 0.0)));
    float bottomRightPresence =
      1.0 - smoothstep(0.08, 0.9, length(vUv - vec2(1.0, 1.0)));
    field = clamp(
      field +
        centerPresence * 0.13 +
        topLeftPresence * 0.3 * (0.45 + firstWarp * 0.55),
      0.0,
      1.0
    );
    field *= 1.0 - bottomRightPresence * 0.45;

    vec2 cell = fract(gl_FragCoord.xy / 6.0) - 0.5;
    float distanceToCenter = length(cell);
    float radius = mix(0.035, 0.64, field);
    float dotShape = 1.0 - smoothstep(
      max(0.0, radius - 0.1),
      radius,
      distanceToCenter
    );
    float cloudAlpha = smoothstep(0.08, 0.72, field);

    gl_FragColor = vec4(
      uPatternColor,
      dotShape * cloudAlpha * uOpacity
    );
  }
`;

const colorToRgb = (color: string): [number, number, number] => {
  const normalized = color.trim().replace(/^#/, "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : normalized.slice(0, 6);

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return [0.46, 0.42, 0.38];
  }

  return [
    Number.parseInt(expanded.slice(0, 2), 16) / 255,
    Number.parseInt(expanded.slice(2, 4), 16) / 255,
    Number.parseInt(expanded.slice(4, 6), 16) / 255,
  ];
};

export const DitherBackground: React.FC<DitherBackgroundProps> = ({
  backgroundColor,
  patternColor,
  patternOpacity,
}) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, 1] }}
      >
        <ambientLight intensity={1} />
        <mesh>
          <planeGeometry args={[2, 2]} />
          <shaderMaterial
            transparent
            depthTest={false}
            depthWrite={false}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={{
              uAspect: { value: width / height },
              uOpacity: { value: patternOpacity },
              uPatternColor: { value: colorToRgb(patternColor) },
              uTime: { value: frame / fps },
            }}
          />
        </mesh>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
