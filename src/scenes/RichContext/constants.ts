export const COLORS = {
  background: '#F9F0FA',
  cardBg: '#FFFCFF',
  cardBorder: 'rgba(0,0,0,0.01)',
  connector: '#E8A0A0',
  pulseDot: '#F07060',
  purpleDot: '#B388D9',
  meshDefault: 'rgba(255, 93, 57, 0.1)',
  meshHighlight: '#FF5D39',
  glowBg: 'rgba(255,93,57,0.1)',
};

export const LAYOUT = {
  sceneSize: 600,
  center: 300,

  sundialCardSize: 92,
  sundialBorderRadius: 18,
  sundialLogoInset: 8,

  sourceCardSize: 54,
  sourceBorderRadius: 12,
  sourcePadding: 8,
  sourceLogoSize: 38,

  cardShadow: '0px 1px 1px 0px rgba(0,0,0,0.25)',
  glowBlur: 28,
};

export type SourceConfig = {
  name: string;
  file: string;
  x: number;
  y: number;
  appearFrame: number;
  lineDrawDuration: number;
  pulseSpeed: number;
  pulseCount: number;
};

export const SOURCE_CONFIGS: SourceConfig[] = [
  {
    name: 'bigquery',
    file: 'bigquery.svg',
    x: 502,
    y: 291,
    appearFrame: 15,
    lineDrawDuration: 22,
    pulseSpeed: 45,
    pulseCount: 1,
  },
  {
    name: 'snowflake',
    file: 'snowflake.svg',
    x: 97,
    y: 114,
    appearFrame: 28,
    lineDrawDuration: 20,
    pulseSpeed: 50,
    pulseCount: 2,
  },
  {
    name: 'aws',
    file: 'aws.svg',
    x: 105,
    y: 490,
    appearFrame: 40,
    lineDrawDuration: 17,
    pulseSpeed: 55,
    pulseCount: 1,
  },
  {
    name: 'slack',
    file: 'slack.svg',
    x: 295,
    y: 86,
    appearFrame: 52,
    lineDrawDuration: 16,
    pulseSpeed: 42,
    pulseCount: 1,
  },
  {
    name: 'notion',
    file: 'notion.svg',
    x: 473,
    y: 503,
    appearFrame: 62,
    lineDrawDuration: 19,
    pulseSpeed: 48,
    pulseCount: 1,
  },
  {
    name: 'gcs',
    file: 'gcs.svg',
    x: 101,
    y: 295,
    appearFrame: 75,
    lineDrawDuration: 18,
    pulseSpeed: 52,
    pulseCount: 2,
  },
  {
    name: 'redshift',
    file: 'redshift.svg',
    x: 499,
    y: 82,
    appearFrame: 88,
    lineDrawDuration: 22,
    pulseSpeed: 46,
    pulseCount: 1,
  },
  {
    name: 'databricks',
    file: 'databricks.svg',
    x: 257,
    y: 503,
    appearFrame: 105,
    lineDrawDuration: 21,
    pulseSpeed: 54,
    pulseCount: 2,
  },
];

export const TIMING = {
  sundialEntranceStart: 0,

  linesFadeStart: 190,
  linesFadeEnd: 215,
  logosFadeStart: 210,
  logosFadeEnd: 240,

  sundialPulseStart: 235,
  dotsScatterStart: 238,
  dotsScatterDuration: 30,
  linesAppearStart: 270,

  highlightCycles: [
    { start: 285, end: 335 },
    { start: 300, end: 350 },
    { start: 330, end: 380 },
    { start: 360, end: 410 },
    { start: 385, end: 435 },
    { start: 415, end: 465 },
  ],

  finalFadeStart: 465,
  finalFadeEnd: 490,

  totalFrames: 510,
};

// --- Seeded PRNG (mulberry32) ---

function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);

// --- Knowledge Graph Dots ---

export type DotConfig = {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
};

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

const TOTAL_DOTS = 45;

function generateDots(): DotConfig[] {
  const dots: DotConfig[] = [];

  // Pre-generate a spread of radii and shuffle for size variety
  const allRadii: number[] = [];
  for (let i = 0; i < TOTAL_DOTS; i++) {
    const t = i / (TOTAL_DOTS - 1);
    allRadii.push(2.5 + t * t * 7.5);
  }
  for (let i = allRadii.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [allRadii[i], allRadii[j]] = [allRadii[j], allRadii[i]];
  }

  let radiusIdx = 0;

  const rings = [
    { dist: 85, count: 8 },
    { dist: 135, count: 14 },
    { dist: 185, count: 16 },
    { dist: 230, count: 7 },
  ];

  for (const ring of rings) {
    const angleStep = (Math.PI * 2) / ring.count;
    const angleOffset = rng() * Math.PI * 2;

    for (let i = 0; i < ring.count; i++) {
      const baseAngle = angleOffset + i * angleStep;
      const angle = baseAngle + (rng() - 0.5) * angleStep * 0.5;
      const dist = ring.dist + (rng() - 0.5) * 30;

      const radius = allRadii[radiusIdx++];
      const x = LAYOUT.center + Math.cos(angle) * dist;
      const y = LAYOUT.center + Math.sin(angle) * dist;

      const lightness = 65 + rng() * 18;
      const saturation = 35 + rng() * 20;
      const color = hsl(270, saturation, lightness);

      dots.push({ id: dots.length, x, y, radius, color });
    }
  }

  return dots;
}

export const DOTS: DotConfig[] = generateDots();

// --- Mesh Edges ---

export type MeshEdge = [number, number];

function distBetweenDots(a: DotConfig, b: DotConfig): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function generateMeshEdges(): MeshEdge[] {
  const edges: MeshEdge[] = [];
  const edgeSet = new Set<string>();
  const degree = new Map<number, number>();

  function addEdge(i: number, j: number): boolean {
    const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
    if (edgeSet.has(key)) return false;
    const dI = degree.get(i) ?? 0;
    const dJ = degree.get(j) ?? 0;
    if (dI >= 4 || dJ >= 4) return false;
    edgeSet.add(key);
    edges.push([i, j]);
    degree.set(i, dI + 1);
    degree.set(j, dJ + 1);
    return true;
  }

  const candidates: { i: number; j: number; dist: number }[] = [];
  for (let i = 0; i < DOTS.length; i++) {
    for (let j = i + 1; j < DOTS.length; j++) {
      candidates.push({ i, j, dist: distBetweenDots(DOTS[i], DOTS[j]) });
    }
  }
  candidates.sort((a, b) => a.dist - b.dist);

  // Short/medium range connections (~25 edges)
  for (const c of candidates) {
    if (edges.length >= 25) break;
    if (c.dist > 180) break;
    if (rng() < 0.5) addEdge(c.i, c.j);
  }

  // Long-range cross connections (~10 edges) that span the canvas
  const longRange = candidates.filter((c) => c.dist > 200);
  for (let attempt = 0; attempt < 50 && edges.length < 35; attempt++) {
    const pick = longRange[Math.floor(rng() * longRange.length)];
    if (pick) addEdge(pick.i, pick.j);
  }

  // Ensure every dot has at least 1 connection
  for (let i = 0; i < DOTS.length; i++) {
    if ((degree.get(i) ?? 0) === 0) {
      let nearest = -1;
      let nearestDist = Infinity;
      for (let j = 0; j < DOTS.length; j++) {
        if (i === j) continue;
        const d = distBetweenDots(DOTS[i], DOTS[j]);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = j;
        }
      }
      if (nearest >= 0) addEdge(i, nearest);
    }
  }

  return edges;
}

export const MESH_EDGES: MeshEdge[] = generateMeshEdges();

// --- Highlight Paths ---

function buildAdjacency(): Map<number, number[]> {
  const adj = new Map<number, number[]>();
  for (const [a, b] of MESH_EDGES) {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }
  return adj;
}

function findPath(adj: Map<number, number[]>, length: number): number[] {
  const visited = new Set<number>();
  const allNodes = Array.from(adj.keys());

  let bestPath: number[] = [];
  for (let attempt = 0; attempt < 20; attempt++) {
    const startIdx = Math.floor(rng() * allNodes.length);
    const start = allNodes[startIdx];
    const path = [start];
    visited.clear();
    visited.add(start);

    let current = start;
    while (path.length < length) {
      const neighbors = (adj.get(current) ?? []).filter((n) => !visited.has(n));
      if (neighbors.length === 0) break;
      const next = neighbors[Math.floor(rng() * neighbors.length)];
      path.push(next);
      visited.add(next);
      current = next;
    }

    if (path.length > bestPath.length) bestPath = path;
    if (bestPath.length >= length) break;
  }

  return bestPath;
}

function generateHighlightPaths(): number[][] {
  const adj = buildAdjacency();
  const paths: number[][] = [];

  for (let i = 0; i < 6; i++) {
    const targetLen = 3 + Math.floor(rng() * 3);
    const capped = Math.min(targetLen, 5);
    const path = findPath(adj, capped);
    paths.push(path);
  }

  return paths;
}

export const HIGHLIGHT_PATHS: number[][] = generateHighlightPaths();

export function getEdgesForPath(path: number[]): MeshEdge[] {
  const edges: MeshEdge[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const found = MESH_EDGES.find(
      ([ea, eb]) => (ea === a && eb === b) || (ea === b && eb === a),
    );
    if (found) edges.push(found);
  }
  return edges;
}
