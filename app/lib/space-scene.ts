import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { Texture } from 'three'
import { GATE, hash, RUIN_LEVELS, RUIN_UNIT, ruinBlocks } from './ruin'
import type { Block } from './ruin'

// "Digital ruin" scene for the home page. One camera travels one continuous space, on one rail:
//   hero (scroll 0)  → the stepped ruin (lib/ruin.ts): a four-tier block ziggurat with a crumbled corner whose
//                      stones drift upward, and an orange-marked stair leading to the summit door;
//   works (scroll 1) → up the stair, through the door, down a stone stairway into a corridor under the ground,
//                      where the four projects are gates (each holding its real screenshot).
// Nothing is swapped or faded: the corridor always exists below an opaque ground, so crossing the door is a real
// move through space. Interaction (driven from components/home/Space.vue):
//   · no preview → the camera waits at the corridor's exploring spot, gates turned half toward it;
//   · preview (hover / focus / first tap) → the camera runs the corridor to that gate, which turns to face it,
//     lights its orange outline and decodes its screenshot; previewing nothing returns it to the exploring spot;
//   · enter (click) → from the gate's stop the camera carries on through the opening, then the page navigates.
// Orange is the only energy colour; project colours live in the HTML and the screenshots only.
// Everything readable lives in HTML; this canvas is decoration + visual focus.
const BG = 0x171614
const SIGNAL = 0xff5b1f
const LINE = 0xa8a39a

export interface Station {
  slug: string
  texture: string // URL of a small (≈640px) version of the real cover screenshot
  aspect: number // cover width / height
  featured?: boolean
}

export interface FrameInfo {
  labels: { slug: string; x: number; y: number; visible: boolean }[]
  azimuth: number // camera bearing around the look target, degrees
  elevation: number
}

export interface SpaceScene {
  setProgress(p: number): void
  /** Preview a gate (null: back to the exploring spot). */
  focus(slug: string | null): void
  /** Fly through a gate; resolves once its screenshot fills the frame (at once with reduced motion). */
  enter(slug: string): Promise<void>
  setReducedMotion(reduced: boolean): void
  dispose(): void
}

const U = RUIN_UNIT
// Looking a little above the ruin's centre and shifted right keeps the summit door clear of the hero title.
const HERO = { pos: new Vector3(7.4, 3.6, 9.8), look: new Vector3(0, 2.1, 0), shift: 0.34 }
const WORKS_SHIFT = 0.2
// The summit door (lib/ruin.ts GATE): a 3×3-block opening above the summit tier, two blocks deep.
const DOOR_Y = (RUIN_LEVELS + 1.5) * U // centre of the opening
const DOOR_FRONT = U * 0.47 // front face of the door pillars
const DOOR_BACK = U * 1.5 // back face
const EYE = DOOR_Y - 0.05 // camera height through the door
// The corridor lies under the ground (y < 0), on the ruin's block grid.
const FLOOR_ROW = -12
const FLOOR = FLOOR_ROW * U
const TOP_ROW = -2 // walls stop a block below the ground
const EYE_IN = FLOOR + 1.9
const MOUTH = -(DOOR_BACK + (EYE - EYE_IN)) // the stairway descends 1:1 from the door's back to the corridor
const HALF = 12 * U // centre line → inner side of the corridor walls
const GAP = 6.5 // between gates along the corridor

/** Irregular closed loop — contour lines on the ground. */
function contour(rx: number, rz: number, seed: number, segments = 120) {
  const pos: number[] = []
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2
    const r = 1 + 0.09 * Math.sin(3 * a + seed) + 0.05 * Math.sin(5 * a + seed * 1.7)
    pos.push(Math.cos(a) * rx * r, 0.004, Math.sin(a) * rz * r)
  }
  return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(pos, 3))
}

// Plate "decode" (patched into the plate's MeshBasicMaterial, so fog / colour space / map handling stay stock).
// An unfocused plate is an undecoded relic: a grey mosaic of its screenshot. Focusing sweeps an orange scan line
// upward that resolves the real image behind it (the screenshot is the only place a project's own colours show).
// Driven by the station's eased focus `amount`, so a re-selection mid-sweep simply reverses the line.
const PLATE_HEAD = 'uniform mat3 mapTransform;\nuniform float uAmount;\nuniform vec3 uSignal;\nuniform vec2 uCells;\nvarying vec2 vPlateUv;\n'
const PLATE_MAP = /* glsl */ `
#ifdef USE_MAP
  float front = clamp((uAmount - 0.5) / 0.48, 0.0, 1.0) * 1.2 - 0.1; // starts once the camera is half-way there
  float done = step(vPlateUv.y, front);
  vec2 cell = (floor(vPlateUv * uCells) + 0.5) / uCells;
  float lum = dot(textureLod(map, (mapTransform * vec3(cell, 1.0)).xy, 4.0).rgb, vec3(0.299, 0.587, 0.114));
  float rows = 0.7 + 0.3 * step(0.5, fract(vPlateUv.y * uCells.y));
  vec3 ghost = vec3(0.1 + 0.45 * lum) * rows;
  diffuseColor.rgb *= mix(ghost, texture(map, vMapUv).rgb, done);
  diffuseColor.rgb += uSignal * (1.0 - smoothstep(0.0, 0.012, abs(vPlateUv.y - front)));
#endif
`

// Stone (patched into the shared MeshStandardMaterial, so lighting / fog stay stock). No textures:
//   · chiselled look — each block darkens toward its edges and its foot, plus a faint world-space grain, so a
//     wall of identical cubes reads as cut stone and no two stones share a pattern;
//   · digital engravings — about one stone in twelve carries thin circuit lines. They are dark grooves, and glow
//     orange near the point of interest (the summit door outside, the previewed gate underground).
const STONE_HEAD = /* glsl */ `
varying vec3 vBoxPos;
varying vec3 vStoneWorld;
varying vec3 vStoneCenter;
`
const STONE_VERTEX = /* glsl */ `
vBoxPos = position / BOX;
#ifdef USE_INSTANCING
  mat4 stoneModel = modelMatrix * instanceMatrix;
#else
  mat4 stoneModel = modelMatrix;
#endif
vStoneWorld = (stoneModel * vec4(position, 1.0)).xyz;
vStoneCenter = (stoneModel * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
`
const STONE_FRAG_HEAD = /* glsl */ `
uniform vec3 uGlowColor;
uniform vec3 uGlowPos;
uniform float uGlowAmount;
float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
`
const STONE_COLOR = /* glsl */ `
vec3 ap = abs(vBoxPos);
float edge = clamp(smoothstep(0.36, 0.5, ap.x) + smoothstep(0.36, 0.5, ap.y) + smoothstep(0.36, 0.5, ap.z) - 1.0, 0.0, 1.0);
float grain = vnoise(vStoneWorld * 7.0) * 0.6 + vnoise(vStoneWorld * 19.0) * 0.4;
diffuseColor.rgb *= (1.0 - 0.32 * edge) * mix(0.72, 1.0, vBoxPos.y + 0.5) * (0.86 + 0.28 * grain);
// Engraving: on the face's own 2D coords, a 5×5 grid where each cell holds a horizontal run, a vertical run or nothing.
float engraving = 0.0;
if (h3(floor(vStoneCenter * 4.0) + 0.37) < 0.08) {
  vec2 uv = ap.x > ap.y && ap.x > ap.z ? vBoxPos.zy : (ap.y > ap.z ? vBoxPos.xz : vBoxPos.xy);
  vec2 g = uv * 5.0 + 2.5;
  vec2 f = fract(g) - 0.5;
  float pick = h3(vec3(floor(g), 0.0) + vStoneCenter);
  float d = pick < 0.3 ? abs(f.y) : (pick < 0.55 ? abs(f.x) : 1.0);
  float w = fwidth(g.x + g.y) * 0.7 + 0.025;
  engraving = (1.0 - smoothstep(w * 0.5, w, d)) * step(max(ap.x, max(ap.y, ap.z)), 0.5) * (1.0 - edge);
  diffuseColor.rgb *= 1.0 - 0.55 * engraving;
}
`
const STONE_EMISSIVE = /* glsl */ `
float near = 1.0 - smoothstep(0.3, 1.8, distance(vStoneCenter, uGlowPos));
totalEmissiveRadiance += uGlowColor * engraving * (0.04 + 0.9 * near * uGlowAmount);
`

// Stone tone: darker at the foot, lighter toward the top, with per-stone variation (one ramp for every structure).
const stoneTone = (t: number, seed: number) => new Color(0x3a3d43).lerp(new Color(0x75787f), Math.min(t * 0.8 + seed * 0.25, 1))
type Cell = { p: [number, number, number]; tone: number }

/** Throws if WebGL is unavailable. `onLost` fires if the context is lost later. */
export function createSpaceScene(
  host: HTMLElement,
  opts: { stations: Station[]; reduced: boolean; onLost: () => void; onFrame: (info: FrameInfo) => void },
): SpaceScene {
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setClearColor(BG, 1)
  const canvas = renderer.domElement
  canvas.style.cssText = 'display:block;width:100%;height:100%'
  host.appendChild(canvas)

  const scene = new Scene()
  const fog = new Fog(BG, 16, 36)
  scene.fog = fog
  const camera = new PerspectiveCamera(34, 1, 0.05, 80)

  const disposables: { dispose(): void }[] = []
  const track = <T extends { dispose(): void }>(o: T): T => (disposables.push(o), o)
  const lineMat = (color: number, opacity: number) => track(new LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }))

  // Daylight outside; it fades as the camera goes underground (see update), where the orange lights take over.
  const sky = new HemisphereLight(0xdfe2e8, BG, 1.1)
  const sun = new DirectionalLight(0xffffff, 2.1)
  sun.position.set(5, 9, 4)
  scene.add(sky, sun)

  // Everything shares the ruin's frame: turned toward the hero camera (≈37° azimuth) so the door is seen ≈10°
  // off-axis. Local +z faces the stair; local −z runs from the door inward and down to the corridor.
  const ruin = new Group()
  ruin.rotation.y = 0.44
  scene.add(ruin)
  ruin.updateMatrixWorld(true)

  // ---- Shared materials, the orange edge-frame (door and gate outlines), masonry
  const blockGeo = track(new BoxGeometry(U * 0.94, U * 0.94, U * 0.94)) // the 6% gap draws the masonry joints
  const stoneMat = track(new MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0, flatShading: true }))
  const stoneFx = { uGlowColor: { value: new Color(SIGNAL) }, uGlowPos: { value: new Vector3() }, uGlowAmount: { value: 1 } }
  stoneMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, stoneFx)
    shader.vertexShader = `#define BOX ${(U * 0.94).toFixed(4)}\n` + STONE_HEAD
      + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n${STONE_VERTEX}`)
    shader.fragmentShader = STONE_HEAD + STONE_FRAG_HEAD + shader.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>\n${STONE_COLOR}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${STONE_EMISSIVE}`)
  }
  const signal = new Color(SIGNAL)
  const signalMat = track(new MeshBasicMaterial({ color: SIGNAL }))
  const inlayGeo = track(new PlaneGeometry(U * 0.28, U * 0.94))
  // Inside, where the camera walks right over them, the inlays narrow to the corridor's guide-line width.
  const guideInlayGeo = track(new PlaneGeometry(0.05, U * 0.94))
  const inlay = (x: number, y: number, z: number, geo = inlayGeo) => {
    const m = new Mesh(geo, signalMat)
    m.rotation.x = -Math.PI / 2
    m.position.set(x, y + 0.002, z)
    return m
  }
  /** Thin orange strips around an opening of w × h, centred at the origin, facing +z. */
  const edgeFrame = (w: number, h: number, mat: MeshBasicMaterial) => {
    const g = new Group()
    const th = 0.03
    for (const [x, y, sw, sh] of [[0, h / 2, w + th, th], [0, -h / 2, w + th, th], [-w / 2, 0, th, h], [w / 2, 0, th, h]]) {
      const strip = new Mesh(track(new PlaneGeometry(sw, sh)), mat)
      strip.position.set(x!, y!, 0)
      g.add(strip)
    }
    return g
  }
  const masonryMesh = (cells: Cell[]) => {
    const mesh = new InstancedMesh(blockGeo, stoneMat, cells.length)
    const m4 = new Matrix4()
    cells.forEach(({ p: [x, y, z], tone }, i) => {
      mesh.setMatrixAt(i, m4.makeTranslation(x, y, z))
      mesh.setColorAt(i, stoneTone(tone, hash(x * 7.1, y * 3.3, z * 5.7)))
    })
    return mesh
  }

  // ---- The ruin (block layout shared with the SVG fallback)
  const { solid, fragments } = ruinBlocks()
  const at = (b: Block, v = new Vector3()) => v.set(b.x * U, b.y * U + U / 2, b.z * U)
  const RUIN_ROWS = RUIN_LEVELS + 4
  ruin.add(masonryMesh([...solid, ...GATE].map(b => ({ p: at(b).toArray() as Cell['p'], tone: b.y / RUIN_ROWS }))))
  for (const b of solid.filter(s => s.glyph)) ruin.add(inlay(b.x * U, (b.y + 1) * U - U * 0.025, b.z * U)) // stair treads
  // The door: an orange outline on its front face; a light down the stairway that lights the treads and leaves
  // the roof steps facing the door in shadow; and a glow veil in the opening, brightest at the foot, that thins
  // out as the camera comes close, so from the hero it reads as a lit doorway and up close the stairway emerges.
  const doorFrame = edgeFrame(U * 3.06, U * 3.06, signalMat)
  doorFrame.position.set(0, DOOR_Y, DOOR_FRONT + 0.003)
  const doorLight = new PointLight(SIGNAL, 2.2, 3.2, 2)
  doorLight.position.set(0, DOOR_Y - 0.9, -DOOR_BACK - 1.1)
  const veilGeo = track(new PlaneGeometry(U * 3, U * 3))
  const veilColors: number[] = []
  for (let i = 0; i < veilGeo.attributes.position!.count; i++) {
    const c = signal.clone().multiplyScalar(veilGeo.attributes.position!.getY(i) > 0 ? 0.18 : 0.85)
    veilColors.push(c.r, c.g, c.b)
  }
  veilGeo.setAttribute('color', new Float32BufferAttribute(veilColors, 3))
  const veilMat = track(new MeshBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, fog: false }))
  const veil = new Mesh(veilGeo, veilMat)
  veil.position.set(0, DOOR_Y, -U * 0.6)
  ruin.add(doorFrame, doorLight, veil)
  const doorWorld = ruin.localToWorld(new Vector3(0, DOOR_Y, 0))

  // Fragments of the crumbled corner. Motion grows with `rank`: stones that just broke off barely sway;
  // the farthest drift and turn more. Each has its own amplitude, speed and spin, so nothing moves in sync.
  // The top few (`decoded`) carry an orange outline.
  const outlineMat = lineMat(SIGNAL, 0.9)
  const blockEdges = track(new EdgesGeometry(blockGeo))
  const fragmentMat = track(new MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true }))
  const drifting = fragments.map((f, i) => {
    const mat = track(fragmentMat.clone())
    mat.onBeforeCompile = stoneMat.onBeforeCompile // clone() doesn't carry it
    mat.color.copy(stoneTone(f.y / RUIN_ROWS, hash(f.x, f.z, f.y)))
    const mesh = new Mesh(blockGeo, mat)
    at(f, mesh.position)
    mesh.rotation.set(f.rx, f.ry, 0)
    if (f.decoded) mesh.add(new LineSegments(blockEdges, outlineMat))
    ruin.add(mesh)
    return {
      mesh, mat, f, y: mesh.position.y,
      amp: 0.03 + f.rank * 0.11 + hash(i, 4, 4) * 0.03, // 0.03 – 0.17
      speed: 0.35 + hash(i, 6, 1) * 0.5, // rad/s
      spinY: (0.04 + f.rank * 0.18) * (hash(i, 8, 3) < 0.5 ? -1 : 1),
      spinX: (hash(i, 1, 7) - 0.5) * 0.08 * f.rank,
    }
  })
  let focusGlow = 0

  // ---- Underground masonry, on the ruin's grid (x and row in blocks, z in metres)
  const below: Cell[] = []
  const add = (x: number, row: number, z: number) =>
    below.push({ p: [x * U, row * U + U / 2, z], tone: MathUtils.clamp((row - FLOOR_ROW) / (TOP_ROW - FLOOR_ROW + 1), 0, 1) * 0.75 })
  const eachRow = (fn: (row: number) => void) => { for (let r = FLOOR_ROW; r <= TOP_ROW; r++) fn(r) }

  // Stairway: from the door's back, down 1:1 under the ground to the corridor — treads with the stair's orange
  // inlays, side walls and a roof; past the mouth the treads carry on down to the corridor floor as a solid flight.
  const eyeAt = (z: number) => EYE - Math.max(0, -z - DOOR_BACK)
  const mouthRow = Math.floor((EYE_IN - 0.72) / U)
  let holeNear = 0
  let holeFar = 0 // where the stairway passes through the ground plane
  for (let n = -2; ; n--) {
    const z = n * U
    const pastMouth = z < MOUTH
    const row = pastMouth ? mouthRow - Math.round((MOUTH - z) / U) : Math.floor((eyeAt(z) - 0.72) / U)
    if (pastMouth && (row + 1) * U <= FLOOR + 0.01) break
    for (let x = -1; x <= 1; x++) add(x, row, z)
    ruin.add(inlay(0, (row + 1) * U - U * 0.025, z, guideInlayGeo))
    if (pastMouth) {
      for (let r = FLOOR_ROW; r < row; r++) for (let x = -1; x <= 1; x++) add(x, r, z)
      continue
    }
    for (let r = row + 1; r <= row + 3; r++) add(-2, r, z), add(2, r, z)
    for (let x = -2; x <= 2; x++) add(x, row + 4, z)
    if ((row + 1) * U < 0 && (row + 4) * U > 0) {
      holeNear = holeNear || z + U / 2
      holeFar = z - U / 2
    }
  }

  // Corridor: side walls, arches between gates, a dead end; dark floor, orange guide line down the centre.
  const reachOf = (s: Station) => {
    const box = s.featured ? 3.0 : 2.5
    return { box, reach: Math.sqrt(Math.max((box * 2.2) ** 2 - 2.6 ** 2, 1)) } // camera distance on the centre line
  }
  const EXPLORE_Z = MOUTH - 1.5
  const gateZ: number[] = []
  // The first gate stands far enough ahead that the whole row fits the frame from the exploring spot.
  opts.stations.forEach((s, i) => gateZ.push(i ? gateZ[i - 1]! - GAP : EXPLORE_Z - 3.5 - reachOf(s).reach))
  const ZEND = gateZ[gateZ.length - 1]! - 5
  for (let z = MOUTH, n = 0; z > ZEND; z -= U, n++) {
    eachRow((r) => {
      for (const x of [-12.5, 12.5]) if (hash(x, r, n) > 0.05) add(x, r, z) // a stone missing here and there
    })
  }
  for (let x = -12; x <= 12; x++) {
    eachRow((r) => {
      if (!(Math.abs(x) <= 1 && r > mouthRow && r <= mouthRow + 3)) add(x, r, MOUTH + U / 2) // entrance wall, open at the mouth
      add(x, r, ZEND)
    })
  }
  for (let a = 0; a < gateZ.length - 1; a++) {
    const z = gateZ[a]! - GAP / 2 // between gates, never level with one, so a turning gate can't clip a pillar
    eachRow(r => (add(-11.5, r, z), add(11.5, r, z)))
    for (let x = -11; x <= 11; x++) if (hash(x, a, 3) > 0.1) add(x, TOP_ROW, z)
  }
  ruin.add(masonryMesh(below))
  const floor = new Mesh(track(new PlaneGeometry(HALF * 2, MOUTH - ZEND)), track(new MeshStandardMaterial({ color: 0x22201d, roughness: 1 })))
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, FLOOR, (MOUTH + ZEND) / 2)
  const guide = new Mesh(track(new PlaneGeometry(0.05, MOUTH - ZEND)), signalMat)
  guide.rotation.x = -Math.PI / 2
  guide.position.set(0, FLOOR + 0.004, (MOUTH + ZEND) / 2)
  ruin.add(floor, guide)

  // ---- Ground: an opaque plane (open where the stairway passes through it) that hides the corridor from outside,
  // with contour rings on it (fog fades them out with distance).
  const outer = new Shape().moveTo(-40, -40).lineTo(40, -40).lineTo(40, 40).lineTo(-40, 40).closePath()
  const hx = U * 1.5
  outer.holes.push(new Shape().moveTo(-hx, -holeNear).lineTo(-hx, -holeFar).lineTo(hx, -holeFar).lineTo(hx, -holeNear).closePath())
  // Double-sided: from the corridor it is the dark ceiling (and hides the contour lines on top of it).
  const ground = new Mesh(track(new ShapeGeometry(outer)), track(new MeshBasicMaterial({ color: BG, side: DoubleSide })))
  ground.rotation.x = -Math.PI / 2 // shape y → −z
  ruin.add(ground)
  for (let r = 4.2, k = 0; r < 20; r += 1.7, k++) {
    scene.add(new LineLoop(track(contour(r, r * 0.86, k * 0.9, 160)), lineMat(LINE, k % 4 === 0 ? 0.22 : 0.1)))
  }

  // ---- Camera rail (ruin frame): hero → up the stair → through the door → down the stairway → along the corridor.
  // One scalar `s` (metres along the rail) drives the camera; scrolling and preview only move its goal, so the
  // camera always travels the space instead of cutting through walls, and any move can be interrupted.
  const approach = new CatmullRomCurve3([
    ruin.worldToLocal(HERO.pos.clone()),
    new Vector3(0, EYE + 0.45, 3.2),
    new Vector3(0, EYE + 0.05, 1.1),
    new Vector3(0, EYE, -0.1),
    new Vector3(0, EYE, -DOOR_BACK),
  ], false, 'centripetal')
  const A = approach.getLength()
  const IN = A + (EYE - EYE_IN) * Math.SQRT2 // rail position of the stairway mouth
  const railAt = (s: number, v: Vector3) => {
    if (s <= A) approach.getPointAt(Math.max(s, 0) / A, v)
    else if (s <= IN) {
      const d = (s - A) / Math.SQRT2
      v.set(0, EYE - d, -DOOR_BACK - d)
    }
    else v.set(0, EYE_IN, MOUTH - (s - IN))
    return ruin.localToWorld(v)
  }
  const EXPLORE = IN + (MOUTH - EXPLORE_Z)
  // In the corridor the resting gaze runs down it, turned a little toward the row of gates (the exploring view).
  // Runs to a gate keep this gaze and only turn to the gate as they arrive — never swinging back to the centre
  // line on the way.
  const gaze = new Vector3()
  const corridorGaze = (s: number) => ruin.localToWorld(gaze.set(1.2, EYE_IN - 0.3, MOUTH - (s - IN) - 9))

  // ---- Gates: standing in a row along the corridor's right side (the left of the frame belongs to the HTML text
  // column), turned half toward the exploring spot so all four read as a receding row from there. Each is
  // built from the ruin's own stones (a sill, two pillars and a lintel) around an opening that holds the
  // screenshot. The opening is sized in whole blocks to fit the screenshot inside a square box, so tall and wide
  // covers read at the same scale; the screenshot is cover-cropped (keeping its top) to fill it.
  const loader = new TextureLoader()
  const textures: Texture[] = []
  const tmp = new Vector3()
  const stations = opts.stations.map((s, i) => {
    const { box, reach } = reachOf(s)
    const cw = Math.round((s.aspect >= 1 ? box : box * s.aspect) / U)
    const ch = Math.round((s.aspect >= 1 ? box / s.aspect : box) / U)
    const W = cw * U
    const H = ch * U
    const plateY = U + H / 2
    const x = 2.6
    const z = gateZ[i]!
    const group = new Group()
    group.position.set(x, FLOOR, z)
    ruin.add(group)
    const face = Math.atan2(-x, reach) // toward its camera stop on the centre line
    const rest = MathUtils.lerp(-Math.sign(x) * Math.PI / 2, Math.atan2(-x, EXPLORE_Z - z), 0.5)

    const cells: Cell[] = []
    const put = (k: number, j: number) => cells.push({ p: [(k - (cw + 1) / 2) * U, j * U + U / 2, 0], tone: j / (ch + 2) })
    for (let k = 0; k <= cw + 1; k++) put(k, 0) // sill
    for (let j = 1; j <= ch; j++) put(0, j), put(cw + 1, j) // pillars
    for (let k = 0; k <= cw + 1; k++) if (!((k === 0 || k === cw + 1) && hash(k, i, 7) < 0.4)) put(k, ch + 1) // lintel, worn now and then
    // Orange sill inlay, opening outline and a branch off the guide line — dim at rest, lit when previewed.
    const frameMat = track(new MeshBasicMaterial({ color: SIGNAL }))
    const sill = new Mesh(track(new PlaneGeometry(W, U * 0.28)), frameMat)
    sill.rotation.x = -Math.PI / 2
    sill.position.y = U * 0.975
    const outline = edgeFrame(W, H, frameMat)
    outline.position.set(0, plateY, U * 0.47 + 0.003)
    const branch = new Mesh(track(new PlaneGeometry(Math.abs(x) - U, 0.05)), frameMat)
    branch.rotation.x = -Math.PI / 2
    branch.position.set((x - Math.sign(x) * U) / 2, FLOOR + 0.004, z)
    ruin.add(branch)
    // Light in the opening: warms the pillars' inner faces once the gate is decoded.
    const glow = new PointLight(SIGNAL, 0, Math.max(W, H) * 0.9, 2)
    glow.position.set(0, plateY, U * 0.8)

    const plateMat = track(new MeshBasicMaterial({ color: 0x22201d, transparent: true, opacity: 0.5, toneMapped: false }))
    const decode = { uAmount: { value: 0 }, uSignal: { value: signal }, uCells: { value: new Vector2(W, H).multiplyScalar(12) } }
    plateMat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, decode)
      shader.vertexShader = 'varying vec2 vPlateUv;\n' + shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvPlateUv = uv;')
      shader.fragmentShader = PLATE_HEAD + shader.fragmentShader.replace('#include <map_fragment>', PLATE_MAP)
    }
    const plate = new Mesh(track(new PlaneGeometry(W, H)), plateMat)
    plate.position.y = plateY
    group.add(masonryMesh(cells), sill, outline, glow, plate)

    loader.load(s.texture, (tex) => {
      if (disposed) return tex.dispose()
      tex.colorSpace = SRGBColorSpace
      // Cover-crop into the opening: trim the sides of wide shots, the bottom of tall ones (UV y = 1 is the top).
      const a = tex.image.width / tex.image.height
      const o = W / H
      if (a > o) tex.repeat.set(o / a, 1), tex.offset.set((1 - o / a) / 2, 0)
      else tex.repeat.set(1, a / o), tex.offset.set(0, 1 - a / o)
      textures.push(tex)
      plateMat.map = tex
      plateMat.color.set(0xffffff)
      plateMat.needsUpdate = true
      invalidate()
    })

    const stop = IN + (MOUTH - (z + reach)) // rail position of the camera stop
    const center = ruin.localToWorld(new Vector3(x, FLOOR + plateY, z))
    const into = center.clone().sub(railAt(stop, new Vector3())).normalize()
    return {
      slug: s.slug, group, plateMat, frameMat, glow, decode, rest, face, stop, center,
      through: center.clone().addScaledVector(into, 0.6), // where an enter ends: just past the screenshot
      beyond: center.clone().addScaledVector(into, 4),
      anchor: ruin.localToWorld(new Vector3(x, FLOOR + (ch + 2) * U + 0.3, z)),
      amount: 0, // 0..1 eased preview amount (drives turn, decode, outline, light)
    }
  })

  // ---- State
  let reduced = opts.reduced
  let visible = true
  let disposed = false
  let raf = 0
  let last = 0
  let t = 0
  let progress = 0
  let focused: string | null = null
  let entering: (typeof stations)[number] | null = null
  let enterT = 0
  let enterDone: (() => void) | null = null
  let inside = false
  const pointer = { x: 0, y: 0 }
  const smooth = { x: 0, y: 0 }
  const cur = {
    s: 0, v: 0, pos: HERO.pos.clone(), look: HERO.look.clone(), shift: HERO.shift,
    dir: HERO.look.clone().sub(HERO.pos).normalize(), dist: HERO.look.distanceTo(HERO.pos),
  }
  const RAIL_W = 3.6 // spring stiffness (rad/s): ~90% of any run done in ≈1s
  const want = new Vector3()
  const ahead = new Vector3()
  const size = { w: 1, h: 1 }

  function fit() {
    size.w = host.clientWidth
    size.h = host.clientHeight
    if (!size.w || !size.h) return
    renderer.setSize(size.w, size.h, false)
    camera.aspect = size.w / size.h
  }

  const ease = (v: number) => v * v * (3 - 2 * v)

  function update(dt: number) {
    const snap = reduced || dt === 0
    if (!reduced) t += dt
    // Highlights and the look target ease exponentially (any change can be interrupted and re-aimed from wherever
    // it is); nothing else animates the camera.
    const k = snap ? 1 : 1 - Math.exp(-dt * 3.2)
    smooth.x += (pointer.x - smooth.x) * k
    smooth.y += (pointer.y - smooth.y) * k

    // Rail goal: scrolling carries the camera from the hero to the exploring spot; a previewed (or entered) gate
    // moves the goal to that gate's stop, and the camera runs the corridor to it. Position along the rail is a
    // critically damped spring: it speeds up and settles smoothly, and re-aiming mid-run (quick hovers down the
    // list) keeps its velocity instead of jerking — an exponential approach restarts at full speed on every new
    // goal and crawls through its tail.
    const p = ease(progress)
    const station = entering ?? stations.find(s => s.slug === focused)
    const goal = (station ? station.stop : EXPLORE) * p
    if (snap) {
      cur.s = goal
      cur.v = 0
    }
    else {
      cur.v += (RAIL_W * RAIL_W * (goal - cur.s) - 2 * RAIL_W * cur.v) * dt
      cur.s += cur.v * dt
    }
    railAt(cur.s, cur.pos)
    // Look ahead along the rail (in the corridor: the corridor gaze); at the hero look at the ruin; turn to the
    // gate over the last stretch of a run (wide enough that the camera turns while still moving).
    railAt(cur.s + 3, ahead)
    want.copy(ahead).lerp(corridorGaze(cur.s), MathUtils.smoothstep(cur.s, IN, EXPLORE))
    if (station) want.lerp(station.center, 1 - MathUtils.smoothstep(Math.abs(cur.s - station.stop), 0, 9))
    want.lerp(HERO.look, 1 - MathUtils.smoothstep(cur.s, 0, A * 0.45))
    // Ease the view direction (and distance), not the look point: a fast run must never overtake a lagging look
    // point and glance backwards for a moment.
    want.sub(cur.pos)
    cur.dist += (want.length() - cur.dist) * k
    cur.dir.lerp(want.normalize(), k)
    if (cur.dir.lengthSq() > 1e-6) cur.dir.normalize()
    cur.look.copy(cur.pos).addScaledVector(cur.dir, cur.dist)
    cur.shift += (MathUtils.lerp(HERO.shift, WORKS_SHIFT, p) - cur.shift) * k

    // Pointer orbits the camera a little around its look target (echoed in the HTML readout). It fades out on the
    // way up the stair so the camera goes through the door dead centre, and only a little returns in the corridor.
    const sway = Math.max(1 - MathUtils.smoothstep(cur.s, 0, A * 0.6), 0.3 * MathUtils.smoothstep(cur.s, IN, IN + 2))
    camera.position.subVectors(cur.pos, cur.look).applyAxisAngle(camera.up, -smooth.x * 0.2 * sway).add(cur.look)
    camera.position.y += -smooth.y * 0.6 * sway
    tmp.copy(cur.look)
    // Enter: once at the gate's stop, carry on through the opening; hand over to the page as the screenshot
    // fills the frame.
    if (entering) {
      if (snap || Math.abs(cur.s - entering.stop) < 0.6) enterT = Math.min(enterT + (snap ? 1 : dt / 0.9), 1)
      const e = ease(enterT)
      camera.position.lerp(entering.through, e)
      tmp.lerp(entering.beyond, e)
      if (enterT >= 0.8) {
        enterDone?.()
        enterDone = null
      }
    }
    camera.lookAt(tmp)
    camera.setViewOffset(size.w, size.h, -cur.shift * size.w, 0, size.w, size.h)
    camera.updateProjectionMatrix()

    // The door's glow veil thins out as the camera nears it (gone before the camera reaches the opening).
    veilMat.opacity = MathUtils.smoothstep(camera.position.distanceTo(doorWorld), 0.8, 4)
    veil.visible = veilMat.opacity > 0.001
    // Going underground: daylight and the open-air fog ease into the corridor's (no switch — follows depth).
    const depth = 1 - MathUtils.smoothstep(camera.position.y, -2, 1)
    inside = camera.position.y < -1
    sky.intensity = MathUtils.lerp(1.1, 0.3, depth)
    sun.intensity = MathUtils.lerp(2.1, 0.35, depth)
    fog.near = MathUtils.lerp(16, 4, depth)
    fog.far = MathUtils.lerp(36, 22, depth)

    // Idle motion (none for reduced motion): each fragment on its own amplitude / speed / spin.
    if (!reduced) {
      for (const d of drifting) {
        d.mesh.position.y = d.y + Math.sin(t * d.speed + d.f.phase) * d.amp
        d.mesh.rotation.y = d.f.ry + t * d.spinY
        d.mesh.rotation.x = d.f.rx + Math.sin(t * d.speed * 0.5 + d.f.phase) * d.spinX * 4
      }
    }
    // Selection echo on the ruin: fragments warm slightly once a project is in focus.
    focusGlow += ((station ? p : 0) - focusGlow) * k
    for (const d of drifting) d.mat.emissive.copy(signal).multiplyScalar(0.06 * focusGlow * (0.4 + d.f.rank))

    // Gates: the previewed one turns to face the camera, decodes, lights its outline; the others turn back and dim.
    for (const s of stations) {
      s.amount += ((s === station ? p : 0) - s.amount) * k
      s.group.rotation.y = MathUtils.lerp(s.rest, s.face, ease(s.amount))
      s.plateMat.opacity = MathUtils.lerp(station && s !== station ? 0.55 : 0.85, 1, s.amount)
      s.decode.uAmount.value = s.amount
      s.frameMat.color.copy(signal).multiplyScalar(0.18 + 0.82 * s.amount)
      s.glow.intensity = 1.6 * s.amount
    }
    // Engravings glow around the door outside, around the previewed gate underground.
    stoneFx.uGlowPos.value.lerp(depth > 0.5 && station ? station.center : doorWorld, k)
    stoneFx.uGlowAmount.value = MathUtils.lerp(1, station?.amount ?? 0, depth)
  }

  function report() {
    const labels = stations.map((s) => {
      tmp.copy(s.anchor)
      tmp.project(camera)
      return {
        slug: s.slug,
        x: (tmp.x + 1) / 2 * size.w,
        y: (1 - tmp.y) / 2 * size.h,
        // Underground only, never over the HTML text column on the left. Previewing a gate shows its label alone;
        // at the exploring spot every nearby gate is labelled.
        visible: inside && !entering && progress > 0.8 && (focused ? s.slug === focused : s.anchor.distanceTo(camera.position) < 16) &&
          tmp.z < 1 && tmp.x > -0.1 && tmp.x < 1.05 && Math.abs(tmp.y) < 1.05,
      }
    })
    tmp.subVectors(camera.position, cur.look)
    opts.onFrame({
      labels,
      azimuth: (MathUtils.radToDeg(Math.atan2(tmp.x, tmp.z)) + 360) % 360,
      elevation: MathUtils.radToDeg(Math.asin(tmp.y / tmp.length())),
    })
  }

  function draw(dt: number) {
    update(dt)
    renderer.render(scene, camera)
    report()
  }

  function frame(now: number) {
    raf = 0
    const dt = Math.min((now - last) / 1000, 1 / 20)
    last = now
    draw(dt)
    if (visible && !reduced) raf = requestAnimationFrame(frame)
  }

  function wake() {
    if (raf || !visible || disposed) return
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }

  /** Reduced motion renders on demand (snapped, no loop); otherwise make sure the loop runs. */
  function invalidate() {
    if (disposed) return
    if (reduced) draw(0)
    else wake()
  }

  const onPointer = (e: PointerEvent) => {
    if (reduced || e.pointerType === 'touch') return
    pointer.x = (e.clientX / innerWidth) * 2 - 1
    pointer.y = (e.clientY / innerHeight) * 2 - 1
  }
  window.addEventListener('pointermove', onPointer, { passive: true })

  const resizeObserver = new ResizeObserver(() => {
    fit()
    invalidate()
  })
  resizeObserver.observe(host)

  // Off-screen: stop rendering entirely.
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting
    if (visible) invalidate()
    else {
      cancelAnimationFrame(raf)
      raf = 0
    }
  })
  intersectionObserver.observe(host)

  const onContextLost = (e: Event) => {
    e.preventDefault()
    cancelAnimationFrame(raf)
    raf = 0
    enterDone?.()
    opts.onLost()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  fit()
  draw(0)
  wake()

  return {
    setProgress(p) {
      progress = MathUtils.clamp(p, 0, 1)
      invalidate()
    },
    focus(slug) {
      focused = slug
      invalidate()
    },
    enter(slug) {
      const station = stations.find(s => s.slug === slug)
      if (!station || reduced || !visible || disposed) return Promise.resolve()
      enterDone?.()
      entering = station
      enterT = 0
      return new Promise<void>((resolve) => {
        enterDone = resolve
        wake()
      })
    },
    setReducedMotion(value) {
      reduced = value
      if (reduced) pointer.x = pointer.y = 0
      invalidate()
    },
    dispose() {
      disposed = true
      enterDone?.()
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      canvas.removeEventListener('webglcontextlost', onContextLost)
      for (const d of disposables) d.dispose()
      for (const tex of textures) tex.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
