// ============================================================================================
// 〔中文導讀〕本檔是首頁 3D 場景，整體分 5 段，建議照這個順序讀：
//   1. 檔頭常數與型別：顏色、鏡頭起點、迴廊尺寸，以及對外的介面（Station / FrameInfo / SpaceScene）
//   2. GLSL 字串：寫給顯示卡執行的材質補丁（石紋、截圖解碼）
//   3. createSpaceScene() 前半：建立遺跡、迴廊、地面、作品門（只在載入時執行一次）
//   4. update() / draw()：每一幀做的事（鏡頭彈簧、燈光、作品門轉向）
//   5. 檔尾 return {…}：對外提供的操作（捲動進度、預覽、進入、釋放資源）
// ============================================================================================
// 〔匯入〕從 three 只匯入用到的類別（具名匯入），打包工具能把沒用到的部分剔除，檔案較小。
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
// 〔import type〕只匯入「型別」，編譯後整行消失，不會多帶任何執行碼。
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
// 〔顏色常數〕0x 開頭是十六進位色碼。BG = 背景暖炭黑，SIGNAL = 唯一的橘色訊號色，LINE = 等高線的灰。
// 改成常數是為了「改一處、全場景同步」，不在程式裡散落同一組數字。
const BG = 0x171614
const SIGNAL = 0xff5b1f
const LINE = 0xa8a39a

// 〔interface 介面〕規定「每個作品站」要提供哪些欄位，傳錯會被編譯器擋下。
// 欄位後面的 ? 表示可有可無（例如 featured）。
export interface Station {
  slug: string
  texture: string // URL of a small (≈640px) version of the real cover screenshot
  aspect: number // cover width / height
  featured?: boolean
}

// 每一幀渲染完，場景回報給 HTML 的資料：作品標籤該擺在螢幕哪裡、鏡頭角度（供畫面角落的讀數使用）。
// 場景只負責畫，標籤文字與按鈕是 HTML，這樣鍵盤與螢幕閱讀器才用得到。
export interface FrameInfo {
  activeWork: string | null
  archiveReady: boolean
  guideX: number
  guideY: number
  labels: { slug: string; x: number; y: number; visible: boolean }[]
  azimuth: number // camera bearing around the look target, degrees
  elevation: number
}

// 場景「對外開放的操作」清單：外面（components/space/Stage.vue）只能透過這幾個方法控制場景，碰不到內部變數。
// focus(slug: string | null) 的 `string | null` 是聯集型別：傳作品代號＝預覽該作品，傳 null＝回到預設位置。
export interface SpaceScene {
  focusNote(index: number | null): void
  setProgress(p: number): void
  /** Preview a gate (null: back to the exploring spot). */
  focus(slug: string | null): void
  /** Fly through a gate; resolves once its screenshot fills the frame (at once with reduced motion). */
  enter(slug: string): Promise<void>
  setReducedMotion(reduced: boolean): void
  dispose(): void
}

// U = 一個方塊的邊長（公尺）。整個場景的尺寸都用「幾個方塊 × U」算，所以所有東西會對齊同一個格線。
const U = RUIN_UNIT
// Looking a little above the ruin's centre and shifted right keeps the summit door clear of the hero title.
// 首頁最初的鏡頭設定：pos＝鏡頭位置、look＝看向哪個點、shift＝畫面整體往右偏多少（0.34＝34% 寬度，
// 把石門讓出來，避免被左邊的標題蓋住）。new Vector3(x, y, z) 是三維座標。
const HERO = { pos: new Vector3(7.4, 3.6, 9.8), look: new Vector3(0, 2.1, 0), shift: 0.34 }
const WORKS_SHIFT = 0.2
// The summit door (lib/ruin.ts GATE): a 3×3-block opening above the summit tier, two blocks deep.
// 以下是石門與地下迴廊的尺寸常數，全都用「方塊數 × U」推出，這樣門、階梯、迴廊接起來不會有縫。
// 座標約定：y 向上；地面是 y = 0；迴廊在地面以下（y < 0）。
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
// 〔函式〕產生一圈「不規則的封閉曲線」當作地面的等高線。
// 做法：把圓的半徑乘上 1 + 0.09·sin(3a) + 0.05·sin(5a)，兩個不同頻率的 sin 疊加，圓就變成不規則形狀。
// seed 讓每一圈長得不一樣；回傳的 BufferGeometry 是 GPU 吃的頂點資料（每個點 3 個數字 x, y, z）。
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
// 〔GLSL 字串 1/2：作品截圖的「解碼」效果〕以下三個字串（PLATE_HEAD / PLATE_MAP 與下面石頭那組）不是 JS，
// 是 GLSL，會在顯示卡上對「每個像素」各執行一次。之後透過 onBeforeCompile 插進 three 的內建材質。
// PLATE_HEAD＝宣告變數：uniform 是 JS 每幀傳進去的值（uAmount 解碼進度 0~1），varying 是頂點端傳給像素端的值。
const PLATE_HEAD = 'uniform mat3 mapTransform;\nuniform float uAmount;\nuniform vec3 uSignal;\nuniform vec2 uCells;\nvarying vec2 vPlateUv;\n'
// PLATE_MAP＝取代 three 內建的 #include <map_fragment>（貼圖取色那一步）：
//   front  掃描線目前的高度；done = step(...) 是 0/1，判斷「這個像素在掃描線下方（已解碼）」；
//   cell / textureLod(…, 4.0) 把畫面切成格子並取模糊層級 → 灰階馬賽克；lum 是亮度；
//   mix(ghost, 原圖, done) 在「灰階馬賽克」與「真圖」之間切換；最後一行在掃描線位置加上橘色亮線。
// #ifdef USE_MAP 是條件編譯：材質沒有貼圖時整段不編譯，避免出錯。
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
// 〔GLSL 字串 2/2：石頭材質〕不用貼圖，全部用程式算出石紋。四個字串依序是：
// STONE_HEAD = 宣告頂點端與像素端共用的 varying（方塊內座標、世界座標、方塊中心）。
const STONE_HEAD = /* glsl */ `
varying vec3 vBoxPos;
varying vec3 vStoneWorld;
varying vec3 vStoneCenter;
`
// STONE_VERTEX（頂點端）：算出每個頂點在方塊內與世界的位置。#ifdef USE_INSTANCING 的意思是：
// 若這個網格是「實例化」的（見 masonryMesh），要多乘上每個實例自己的 instanceMatrix。
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
// STONE_FRAG_HEAD（像素端宣告）：h3 是「偽隨機雜湊」（同樣輸入必得同樣輸出），vnoise 用它做出平滑的 3D 噪點。
// 噪點用世界座標當輸入，所以每顆石頭的紋路都不同，但每次載入長得一樣。
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
// STONE_COLOR（改變底色）：edge 讓方塊邊緣變暗（看起來像切割過的石頭）；mix(0.72, 1.0, …) 讓底部較暗；
// grain 疊兩層不同頻率的噪點當顆粒。接著約 1/12 的石塊畫「電路刻痕」：用 fract 把表面切成 5×5 格，
// 每格隨機決定畫橫線、直線或不畫；fwidth 讓線寬隨距離自動調整，遠看不會破碎。
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
// STONE_EMISSIVE（自發光）：刻痕離「興趣點」（外面是石門、地下是被預覽的門）越近越亮橘。
// smoothstep(0.3, 1.8, 距離) 把距離平滑轉成 0~1；uGlowAmount 由 JS 每幀調整，整體開關發光。
const STONE_EMISSIVE = /* glsl */ `
float near = 1.0 - smoothstep(0.3, 1.8, distance(vStoneCenter, uGlowPos));
totalEmissiveRadiance += uGlowColor * engraving * (0.04 + 0.9 * near * uGlowAmount);
`

// Stone tone: darker at the foot, lighter toward the top, with per-stone variation (one ramp for every structure).
// 石頭的底色：由下到上從深灰漸變淺灰（lerp = 線性插值），再加上每顆石頭自己的隨機偏移（seed），避免整面一模一樣。
const stoneTone = (t: number, seed: number) => new Color(0x3a3d43).lerp(new Color(0x75787f), Math.min(t * 0.8 + seed * 0.25, 1))
// type 別名：一顆石頭 = 位置 p（固定三格的元組 [x, y, z]）+ 色調 tone（0~1）。
type Cell = { p: [number, number, number]; tone: number }

/** Throws if WebGL is unavailable. `onLost` fires if the context is lost later. */
// 〔主函式〕createSpaceScene 建立整個 3D 場景，並回傳一個含方法的物件（見檔尾 return）。
// 內部的 progress、focused、cur 等變數靠「閉包」存在函式裡，外界讀不到也改不到，只能透過回傳的方法操作。
// host＝放 canvas 的容器；opts 裡 stations 是作品資料、onFrame 是每幀回報給 HTML 的回呼函式。
export function createSpaceScene(
  host: HTMLElement,
  opts: { stations: Station[]; reduced: boolean; onLost: () => void; onFrame: (info: FrameInfo) => void },
): SpaceScene {
  // renderer = 把場景畫到 <canvas> 的繪圖器。antialias 開啟邊緣抗鋸齒；
  // setPixelRatio(Math.min(devicePixelRatio, 2)) 限制最多 2 倍像素密度，高解析螢幕不必畫到 3 倍（成本差很多）。
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setClearColor(BG, 1)
  const canvas = renderer.domElement
  canvas.style.cssText = 'display:block;width:100%;height:100%'
  host.appendChild(canvas)

  // scene = 放所有 3D 物件的容器；fog 是距離霧（16~36 公尺之間漸漸融入背景色），同時遮掉遠處細節；camera 是透視鏡頭（視角 34°）。
  const scene = new Scene()
  const fog = new Fog(BG, 16, 36)
  scene.fog = fog
  const camera = new PerspectiveCamera(34, 1, 0.05, 80)

  // 〔釋放資源〕GPU 上的幾何體、材質、貼圖不會被 JS 垃圾回收，必須手動 dispose()。
  // track() 是一個「登記」函式：每建一個要釋放的東西就包一層，離開時（見檔尾 dispose）統一清掉。
  const disposables: { dispose(): void }[] = []
  // 〔泛型 <T extends { dispose(): void }>〕意思是：接受「任何有 dispose 方法的物件」，並原樣回傳同一個型別。
  // 所以幾何體、材質、貼圖都能用同一個 track 包。`(a, b)` 是逗號運算式：先執行 push 登記，再回傳 o。
  const track = <T extends { dispose(): void }>(o: T): T => (disposables.push(o), o)
  // 建立線條材質的小工具：depthWrite: false 讓半透明線不會擋住後面的東西。
  const lineMat = (color: number, opacity: number) => track(new LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }))

  // Daylight outside; it fades as the camera goes underground (see update), where the orange lights take over.
  // 戶外光：sky 是天空半球光（上亮下暗的環境光），sun 是平行的太陽光。進入地下後，update() 會把它們調暗。
  const sky = new HemisphereLight(0xdfe2e8, BG, 1.1)
  const sun = new DirectionalLight(0xffffff, 2.1)
  sun.position.set(5, 9, 4)
  scene.add(sky, sun)

  // Everything shares the ruin's frame: turned toward the hero camera (≈37° azimuth) so the door is seen ≈10°
  // off-axis. Local +z faces the stair; local −z runs from the door inward and down to the corridor.
  // ruin = 一個「群組」，遺跡、迴廊、作品門都放進它，所以只要轉這一個群組（rotation.y = 0.44），
  // 整個空間就一起轉向，不用逐一調整座標。updateMatrixWorld 先算好它的世界矩陣，後面才能做座標轉換。
  const ruin = new Group()
  ruin.rotation.y = 0.44
  scene.add(ruin)
  ruin.updateMatrixWorld(true)

  // ---- Shared materials, the orange edge-frame (door and gate outlines), masonry
  // 方塊幾何體（共用一份）。邊長只取 94%，剩下 6% 就是方塊之間的縫，不必另外畫砌磚線。
  const blockGeo = track(new BoxGeometry(U * 0.94, U * 0.94, U * 0.94)) // the 6% gap draws the masonry joints
  // 石頭材質（所有石頭共用一個）。MeshStandardMaterial 是會吃光照的物理材質；flatShading 讓每個面是平的、有稜角感。
  // stoneFx 是要傳進 shader 的 uniform（發光顏色、位置、強度），每幀由 update() 改值。
  const stoneMat = track(new MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0, flatShading: true }))
  const stoneFx = { uGlowColor: { value: new Color(SIGNAL) }, uGlowPos: { value: new Vector3() }, uGlowAmount: { value: 1 } }
  // 〔onBeforeCompile〕材質在編譯成 GPU 程式前，three 會先給你原始碼字串，讓你「改」它。
  // 做法：.replace("#include <某個內建片段>", 原片段 + 自己的 GLSL)，在指定位置「插入」程式，其餘保持原樣，
  // 所以光照、霧、色彩空間仍由 three 處理，只多了石紋與發光。Object.assign 把自訂 uniform 併進去。
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
  // 用四條細長平面拼成矩形外框（橘色門框）。`for (const [x, y, sw, sh] of […])` 是「走訪陣列並解構」，一次取出四個數字。
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
  // 〔InstancedMesh 實例化〕同一個方塊幾何體畫成 cells.length 個，每個只有自己的位置與顏色。
  // 好處：幾百顆石頭只需要「一次」繪製指令（draw call），比建幾百個 Mesh 快很多。
  // setMatrixAt 設定第 i 個實例的位置；setColorAt 設定它的顏色。
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
  // 從 ruin.ts 取得遺跡的方塊資料（solid＝完整的方塊、fragments＝崩落後漂浮的碎塊）。SVG 備援版畫的也是同一份資料。
  const { solid, fragments } = ruinBlocks()
  // 把「格線座標」(整數 x, y, z) 轉成「世界座標」(公尺)。`v = new Vector3()` 是預設參數：沒傳就新建一個，
  // 有傳就重用傳進來的，避免每次都配置新物件。
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
  // 門內的「光霧」：一片平面，用頂點顏色讓下方亮（0.85）、上方暗（0.18），加法混合後看起來像門內透出的光。
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
  // 為每一塊漂浮碎塊建立獨立的 Mesh（它們會各自動，所以不能用實例化）。
  // 每塊有自己的振幅（amp）、速度（speed）、自轉（spinX / spinY），越遠離崩落口動得越大，才不會全部同步。
  // `mat.onBeforeCompile = stoneMat.onBeforeCompile`：clone() 不會複製這個函式，要手動接回，碎塊才有同樣石紋。
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
  // 〔地下石牆〕below 收集所有地下的石頭，最後一次交給 masonryMesh 變成單一 InstancedMesh。
  // add(x, row, z) 把「格線座標」轉成實際位置並登記；eachRow 對每一層（row）執行一次傳入的函式。
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
  // 〔階梯〕從石門後方一路往下鋪階：每走一格（z 遞減）就往下一格（1:1 斜坡），並補上兩側牆與屋頂。
  // 這個 for 沒有結束條件，靠中間的 `break`（走到迴廊底部）跳出；continue 則跳過該圈後面的步驟。
  // holeNear / holeFar 記錄階梯穿過地面的範圍，等一下地面要在這裡「挖洞」。
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
  // 算每個作品門需要的尺寸（box，精選作品較大）與「鏡頭該站多遠」（reach）。
  // 用畢氏定理推：reach = √((box×2.2)² − 2.6²)，讓鏡頭停在剛好能把門框進畫面的距離。`**` 是次方運算。
  const reachOf = (s: Station) => {
    const box = s.featured ? 3.0 : 2.5
    return { box, reach: Math.sqrt(Math.max((box * 2.2) ** 2 - 2.6 ** 2, 1)) } // camera distance on the centre line
  }
  const EXPLORE_Z = MOUTH - 1.5
  const gateZ: number[] = []
  // The first gate stands far enough ahead that the whole row fits the frame from the exploring spot.
  // 排出每扇門在迴廊上的 z 座標：第一扇離入口一段距離，其餘每隔 GAP 公尺一扇。
  // `gateZ[i - 1]!` 的 `!` 是非空斷言：告訴編譯器「這格一定有值」（因為 i > 0 時前一格已被放入）。
  opts.stations.forEach((s, i) => gateZ.push(i ? gateZ[i - 1]! - GAP : EXPLORE_Z - 3.5 - reachOf(s).reach))
  const ZEND = gateZ[gateZ.length - 1]! - 5
  // 鋪迴廊兩側牆：沿 z 一格一格走；`hash(...) > 0.05` 讓約 5% 的石頭缺席，牆面就有殘破感（確定性雜湊，每次載入都一樣）。
  for (let z = MOUTH, n = 0; z > ZEND; z -= U, n++) {
    eachRow((r) => {
      for (const x of [-12.5, 12.5]) if (hash(x, r, n) > 0.05) add(x, r, z) // a stone missing here and there
    })
  }
  for (let x = -12; x <= 12; x++) {
    eachRow((r) => {
      if (!(Math.abs(x) <= 1 && r > mouthRow && r <= mouthRow + 3)) add(x, r, MOUTH + U / 2) // entrance wall, open at the mouth
      if (Math.abs(x) > 3) add(x, r, ZEND)
    })
  }
  for (let a = 0; a < gateZ.length - 1; a++) {
    const z = gateZ[a]! - GAP / 2 // between gates, never level with one, so a turning gate can't clip a pillar
    eachRow(r => (add(-11.5, r, z), add(11.5, r, z)))
    for (let x = -11; x <= 11; x++) if (hash(x, a, 3) > 0.1) add(x, TOP_ROW, z)
  }
  // 把所有地下石頭一次變成一個 InstancedMesh 放進場景，然後鋪地板（暗色）與中央橘色引導線。
  ruin.add(masonryMesh(below))
  const floor = new Mesh(track(new PlaneGeometry(HALF * 2, MOUTH - ZEND)), track(new MeshStandardMaterial({ color: 0x22201d, roughness: 1 })))
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, FLOOR, (MOUTH + ZEND) / 2)
  const guide = new Mesh(track(new PlaneGeometry(0.05, MOUTH - ZEND)), signalMat)
  guide.rotation.x = -Math.PI / 2
  guide.position.set(0, FLOOR + 0.004, (MOUTH + ZEND) / 2)
  ruin.add(floor, guide)

  // A lower archive landing continues the corridor through its open end.
  const archiveDoors = [-1, 1].map(side => {
    const hinge = new Group()
    hinge.position.set(side * 3 * U, FLOOR, ZEND + U)
    const cells: Cell[] = []
    for (let x = 0; x < 3; x++) for (let y = 0; y < 7; y++)
      cells.push({ p: [-side * (x + 0.5) * U, (y + 0.5) * U, 0], tone: y / 7 })
    hinge.add(masonryMesh(cells))
    const seam = new Mesh(track(new BoxGeometry(0.035, 7 * U, 0.025)), signalMat)
    seam.position.set(-side * (3 * U - 0.03), 3.5 * U, U * 0.51)
    hinge.add(seam)
    ruin.add(hinge)
    return { hinge, side }
  })
  const ARCHIVE_DROP = 2.4
  const ARCHIVE_Z = ZEND - 17
  const landingMat = track(new MeshStandardMaterial({ color: 0x292620, roughness: 1 }))
  for (let i = 0; i < 12; i++) {
    const step = new Mesh(track(new BoxGeometry(6 * U, 0.25, 0.5)), landingMat)
    step.position.set(0, FLOOR - (i + 1) * 0.2 - 0.125, ZEND - (i + 0.5) * 0.5)
    const mark = new Mesh(track(new BoxGeometry(0.05, 0.012, 0.5)), signalMat)
    mark.position.copy(step.position).add(new Vector3(0, 0.131, 0))
    ruin.add(step, mark)
  }
  const landing = new Mesh(track(new BoxGeometry(HALF * 2.8, 0.4, 22)), landingMat)
  landing.position.set(0, FLOOR - ARCHIVE_DROP - 0.2, ZEND - 17)
  ruin.add(landing)
  const axis = new Mesh(track(new BoxGeometry(0.05, 0.012, 20)), signalMat)
  axis.position.set(0, FLOOR - ARCHIVE_DROP + 0.006, ZEND - 16)
  ruin.add(axis)
  const archiveCells: Cell[] = []
  for (const x of [-8, 8]) {
    for (let y = 0; y < 7; y++) for (let z = 0; z < 2; z++)
      archiveCells.push({ p: [x * U, FLOOR - ARCHIVE_DROP + (y + 0.5) * U, ARCHIVE_Z - 6 - z * U], tone: y / 7 })
    const branch = new Mesh(track(new BoxGeometry(8 * U, 0.012, 0.05)), signalMat)
    branch.position.set(x * U / 2, FLOOR - ARCHIVE_DROP + 0.006, ARCHIVE_Z - 6)
    ruin.add(branch)
  }
  const noteSlots: { slab: Mesh; material: MeshStandardMaterial; groove: Mesh; branch: Mesh; amount: number }[] = []
  for (let slot = 0; slot < 3; slot++) {
    const material = track(landingMat.clone())
    const slab = new Mesh(track(new BoxGeometry(4.5, 1.1, 0.5)), material)
    slab.position.set(3.4, FLOOR - ARCHIVE_DROP + 1 + (2 - slot) * 1.5, ARCHIVE_Z - 8)
    const groove = new Mesh(track(new BoxGeometry(0.035, 0.8, 0.025)), signalMat)
    groove.position.copy(slab.position).add(new Vector3(-1.9, 0, 0.27))
    const branch = new Mesh(track(new BoxGeometry(3.4, 0.015, 0.04)), signalMat)
    branch.position.set(1.7, FLOOR - ARCHIVE_DROP + 0.015, ARCHIVE_Z - 7 + slot * 0.35)
    ruin.add(slab, groove, branch)
    noteSlots.push({ slab, material, groove, branch, amount: 0 })
  }
  ruin.add(masonryMesh(archiveCells))
  const archiveLight = new PointLight(SIGNAL, 6, 18, 2)
  archiveLight.position.set(0, FLOOR - ARCHIVE_DROP + 3, ARCHIVE_Z - 6)
  ruin.add(archiveLight)

  // ---- Ground: an opaque plane (open where the stairway passes through it) that hides the corridor from outside,
  // with contour rings on it (fog fades them out with distance).
  // 〔地面〕用 Shape 畫一個 80×80 的方形，再用 holes 在階梯穿過的位置挖出矩形洞。
  // 地面是不透明的，所以從外面看不到地下的迴廊，鏡頭穿過石門才是真的「進入」，而不是換場景。
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
  // 〔鏡頭軌道，全場最重要的設計〕鏡頭只沿著一條軌道走，位置由一個數字 s（沿軌道走了幾公尺）決定。
  // 第一段 approach：用 Catmull-Rom 曲線串起「首頁位置 → 階梯 → 門」的幾個控制點，做出平滑彎曲的路徑
  // （centripetal 是曲線演算法的一種，避免曲線在控制點附近打結）。
  // 好處：捲動與預覽只改「目標 s」，鏡頭永遠沿軌道走，不會穿牆，而且隨時可以被打斷。
  const approach = new CatmullRomCurve3([
    ruin.worldToLocal(HERO.pos.clone()),
    new Vector3(0, EYE + 0.45, 3.2),
    new Vector3(0, EYE + 0.05, 1.1),
    new Vector3(0, EYE, -0.1),
    new Vector3(0, EYE, -DOOR_BACK),
  ], false, 'centripetal')
  const A = approach.getLength()
  const IN = A + (EYE - EYE_IN) * Math.SQRT2 // rail position of the stairway mouth
  // railAt(s, v)：給軌道位置 s，算出鏡頭的世界座標，寫進 v。軌道分三段：
  //   s ≤ A      → 外面的曲線；  A < s ≤ IN → 1:1 斜坡往下（水平與垂直各走 d，所以實際路程是 d·√2）；
  //   s > IN     → 迴廊裡的直線。  最後 localToWorld 把「遺跡座標」轉成「世界座標」。
  const railAt = (s: number, v: Vector3) => {
    if (s <= A) approach.getPointAt(Math.max(s, 0) / A, v)
    else if (s <= IN) {
      const d = (s - A) / Math.SQRT2
      v.set(0, EYE - d, -DOOR_BACK - d)
    }
    else {
      const z = MOUTH - (s - IN)
      const descent = MathUtils.smoothstep(ZEND - z, 0, 6)
      v.set(0, EYE_IN - ARCHIVE_DROP * descent, z)
    }
    return ruin.localToWorld(v)
  }
  const EXPLORE = IN + (MOUTH - EXPLORE_Z)
  const ARCHIVE = IN + (MOUTH - ARCHIVE_Z)
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
  // 〔作品門〕對每個作品建一扇門：用遺跡同款石塊拼出「門檻、兩根柱、門楣」，中間放一片貼了該作品截圖的平面。
  // 開口尺寸以整數個方塊計算，讓橫圖與直圖在畫面上看起來一樣大。
  const stations = opts.stations.map((s, i) => {
    const { box, reach } = reachOf(s)
    // cw / ch = 門洞的寬與高（單位：方塊數）。依截圖長寬比 aspect 決定：寬圖寬度取滿、直圖高度取滿，再四捨五入成整數方塊。
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
    // face = 門「轉向鏡頭停靠點」要轉的角度（atan2 由座標算角度）；rest = 沒被預覽時的半轉向角度，
    // 是「正對鏡頭」與「側對鏡頭」的中間值（lerp 的 0.5），讓四扇門在遠處看起來像斜排。
    const face = Math.atan2(-x, reach) // toward its camera stop on the centre line
    const rest = MathUtils.lerp(-Math.sign(x) * Math.PI / 2, Math.atan2(-x, EXPLORE_Z - z), 0.5)

    const cells: Cell[] = []
    // put(k, j) 在門的第 k 欄、第 j 層放一顆石頭。下面三行分別放：門檻（底排）、兩側柱子、門楣（頂排）。
    // 門楣兩端有 40% 機率缺一顆，做出風化感。`,` 逗號運算式讓兩個 put 寫在同一行。
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
    // 截圖平面的材質補丁：頂點端多傳一個 vPlateUv（這個像素在截圖上的 0~1 座標），
    // 像素端用上面的 PLATE_MAP 取代內建的貼圖取色，做出「灰階馬賽克 → 橘線掃描 → 原圖」。
    plateMat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, decode)
      shader.vertexShader = 'varying vec2 vPlateUv;\n' + shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvPlateUv = uv;')
      shader.fragmentShader = PLATE_HEAD + shader.fragmentShader.replace('#include <map_fragment>', PLATE_MAP)
    }
    const plate = new Mesh(track(new PlaneGeometry(W, H)), plateMat)
    plate.position.y = plateY
    group.add(masonryMesh(cells), sill, outline, glow, plate)

    // 〔非同步載入截圖〕載入完成才執行這個回呼。若場景已被釋放（disposed）就立刻丟掉貼圖，避免記憶體洩漏。
    // 載入後：設定色彩空間、依長寬比做 cover 裁切（repeat / offset），貼到平面上，並呼叫 invalidate() 請求重畫。
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

    // 這扇門的「鏡頭停靠點」在軌道上的位置 stop；center 是門的世界座標；into 是由停靠點指向門的方向。
    // 回傳的物件把這扇門所有要在每幀改動的東西收在一起（group、材質、光、amount…），update() 會逐一更新它們。
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
  // 〔狀態變數〕都是閉包內的 let，會隨互動改變：reduced（減少動態）、visible（是否在畫面內）、
  // disposed（是否已釋放）、progress（捲動進度 0~1）、focused（被預覽的作品）、entering（正在穿越的作品）。
  let reduced = opts.reduced
  let visible = true
  let disposed = false
  let raf = 0
  let last = 0
  let t = 0
  let progress = 0
  let departure = EXPLORE
  let scrollAnchor: { progress: number; s: number } | null = null
  const archiveLook = ruin.localToWorld(new Vector3(0, EYE_IN - ARCHIVE_DROP - 0.25, ARCHIVE_Z - 8))
  let focusedNote: number | null = null
  let focused: string | null = null
  let entering: (typeof stations)[number] | null = null
  let enterT = 0
  let enterDone: (() => void) | null = null
  let inside = false
  const pointer = { x: 0, y: 0 }
  const smooth = { x: 0, y: 0 }
  // cur = 鏡頭「目前」的狀態：s 是軌道位置、v 是速度、pos 位置、dir 視線方向、dist 視線距離。
  // 目標值由捲動／預覽決定，cur 每幀逼近目標，不是瞬間跳過去。
  const cur = {
    s: 0, v: 0, pos: HERO.pos.clone(), look: HERO.look.clone(), shift: HERO.shift,
    dir: HERO.look.clone().sub(HERO.pos).normalize(), dist: HERO.look.distanceTo(HERO.pos),
  }
  // 彈簧硬度。數字越大越快到位；3.6 約 1 秒走完 90%。
  const RAIL_W = 3.6 // spring stiffness (rad/s): ~90% of any run done in ≈1s
  const want = new Vector3()
  const ahead = new Vector3()
  const size = { w: 1, h: 1 }

  // 依容器大小調整 canvas 與鏡頭長寬比；容器為 0 時直接跳過，避免除以 0。
  function fit() {
    size.w = host.clientWidth
    size.h = host.clientHeight
    if (!size.w || !size.h) return
    renderer.setSize(size.w, size.h, false)
    camera.aspect = size.w / size.h
  }

  // smoothstep 緩動曲線：v 從 0 到 1 時，開頭與結尾較慢、中段較快（3v² − 2v³）。
  const ease = (v: number) => v * v * (3 - 2 * v)

  // 〔每一幀更新，最核心〕dt 是距離上一幀的秒數。所有動畫都用 dt 計算，所以 60Hz 與 144Hz 螢幕速度一致。
  // snap = true 時（減少動態，或第一次繪製 dt = 0）不做動畫，直接設成最終值。
  function update(dt: number) {
    const snap = reduced || dt === 0
    if (!reduced) t += dt
    // Highlights and the look target ease exponentially (any change can be interrupted and re-aimed from wherever
    // it is); nothing else animates the camera.
    // k = 與幀率無關的指數趨近係數：1 − e^(−dt·3.2)。每幀「向目標靠近 k 比例」，
    // 越靠近目標移動越小，所以停得平順。用 e 的次方（而不是固定 0.1）是為了不同幀率下手感一致。
    const k = snap ? 1 : 1 - Math.exp(-dt * 3.2)
    smooth.x += (pointer.x - smooth.x) * k
    smooth.y += (pointer.y - smooth.y) * k

    // Rail goal: scrolling carries the camera from the hero to the exploring spot; a previewed (or entered) gate
    // moves the goal to that gate's stop, and the camera runs the corridor to it. Position along the rail is a
    // critically damped spring: it speeds up and settles smoothly, and re-aiming mid-run (quick hovers down the
    // list) keeps its velocity instead of jerking — an exponential approach restarts at full speed on every new
    // goal and crawls through its tail.
    // p = 緩動過後的捲動進度；goal = 鏡頭這一刻「想去」的軌道位置：預覽某作品→去它的停靠點，否則去預設探索點。
    const p = ease(Math.min(progress, 1))
    const archive = ease(Math.min(Math.max(progress - 2, 0), 1))
    const station = entering ?? (archive === 0 ? stations.find(s => s.slug === focused) : undefined)
    const notesProgress = ease(Math.max(progress - 3, 0))
    for (let i = 0; i < noteSlots.length; i++) {
      const slot = noteSlots[i]!
      slot.amount += (((focusedNote === i && progress > 3) ? 1 : 0) - slot.amount) * k
      slot.material.emissive.copy(signal).multiplyScalar(slot.amount * 0.32)
      slot.slab.position.z = ARCHIVE_Z - 8 + slot.amount * 0.25
      slot.groove.position.z = slot.slab.position.z + 0.27
      slot.groove.scale.x = 1 + slot.amount * 2
      slot.branch.scale.x = 0.15 + slot.amount * 0.85
      slot.branch.visible = progress > 3
    }
    const worksT = MathUtils.clamp(progress - 1, 0, 1)
    const worksEnd = stations[stations.length - 1]?.stop ?? EXPLORE
    const automatic = scrollAnchor && progress >= scrollAnchor.progress
      ? MathUtils.lerp(scrollAnchor.s, worksEnd, MathUtils.clamp((progress - scrollAnchor.progress) / Math.max(2 - scrollAnchor.progress, 0.01), 0, 1))
      : MathUtils.lerp(EXPLORE, worksEnd, worksT)
    const goal = 3 * notesProgress + MathUtils.lerp((archive > 0 ? departure : station ? station.stop : automatic) * p, ARCHIVE, archive)
    if (snap) {
      cur.s = goal
      cur.v = 0
    }
    else {
      // 〔臨界阻尼彈簧〕加速度 = 硬度²·(目標 − 位置) − 2·硬度·速度，再積分出速度與位置。
      // 「臨界」代表最快到位且不來回晃。重點：它保留速度，快速換目標時動作是連續的；
      // 若用指數趨近，每次換目標都會重新全速起跑，尾巴又拖很久，連續 hover 會一頓一頓。
      cur.v += (RAIL_W * RAIL_W * (goal - cur.s) - 2 * RAIL_W * cur.v) * dt
      cur.s += cur.v * dt
    }
    // Open before the camera reaches the threshold; reverse naturally when scrolling back.
    const doorway = IN + MOUTH - (ZEND + U)
    const doorOpen = MathUtils.smoothstep(cur.s, doorway - 8, doorway - 2)
    for (const door of archiveDoors) door.hinge.rotation.y = -door.side * doorOpen * Math.PI * 0.48
    railAt(cur.s, cur.pos)
    // Look ahead along the rail (in the corridor: the corridor gaze); at the hero look at the ruin; turn to the
    // gate over the last stretch of a run (wide enough that the camera turns while still moving).
    // 〔視線〕want 是「想看的點」，由三個點用 lerp 依位置混合：軌道前方 3 公尺 → 迴廊視線 → 被預覽的門 → 首頁看遺跡。
    // MathUtils.smoothstep(x, 下限, 上限) 把位置轉成 0~1 當混合比例，所以切換是漸變，沒有跳動。
    railAt(cur.s + 3, ahead)
    want.copy(ahead).lerp(corridorGaze(cur.s), MathUtils.smoothstep(cur.s, IN, EXPLORE))
    if (station) want.lerp(station.center, 1 - MathUtils.smoothstep(Math.abs(cur.s - station.stop), 0, 9))
    if (archive > 0) want.lerp(archiveLook, archive)
    want.lerp(HERO.look, 1 - MathUtils.smoothstep(cur.s, 0, A * 0.45))
    // Ease the view direction (and distance), not the look point: a fast run must never overtake a lagging look
    // point and glance backwards for a moment.
    want.sub(cur.pos)
    cur.dist += (want.length() - cur.dist) * k
    // 〔重點〕平滑的是「視線方向」而不是「看的那一點」。若平滑那一點，長距離快速移動時鏡頭可能先超過它，
    // 瞬間回頭看。方向向量平滑就不會。最後 look = 位置 + 方向 × 距離。
    cur.dir.lerp(want.normalize(), k)
    if (cur.dir.lengthSq() > 1e-6) cur.dir.normalize()
    cur.look.copy(cur.pos).addScaledVector(cur.dir, cur.dist)
    cur.shift += (MathUtils.lerp(MathUtils.lerp(HERO.shift, WORKS_SHIFT, p), 0, archive) - cur.shift) * k

    // Pointer orbits the camera a little around its look target (echoed in the HTML readout). It fades out on the
    // way up the stair so the camera goes through the door dead centre, and only a little returns in the corridor.
    const sway = (1 - archive) * Math.max(1 - MathUtils.smoothstep(cur.s, 0, A * 0.6), 0.3 * MathUtils.smoothstep(cur.s, IN, IN + 2))
    camera.position.subVectors(cur.pos, cur.look).applyAxisAngle(camera.up, -smooth.x * 0.2 * sway).add(cur.look)
    camera.position.y += -smooth.y * 0.6 * sway
    tmp.copy(cur.look)
    // Enter: once at the gate's stop, carry on through the opening; hand over to the page as the screenshot
    // fills the frame.
    // 〔進入作品〕到達該門的停靠點後，enterT 在 0.9 秒內從 0 長到 1，鏡頭 lerp 穿過截圖；
    // 到 0.8 時呼叫 enterDone() 讓 Promise 完成，頁面才開始換頁，所以穿越動畫不會被截斷。
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
    // setViewOffset 把投影視窗平移 shift 比例：整個畫面往一側偏，讓出左邊給 HTML 文字欄；updateProjectionMatrix 套用。
    camera.setViewOffset(size.w, size.h, -cur.shift * size.w, 0, size.w, size.h)
    camera.updateProjectionMatrix()

    // The door's glow veil thins out as the camera nears it (gone before the camera reaches the opening).
    veilMat.opacity = MathUtils.smoothstep(camera.position.distanceTo(doorWorld), 0.8, 4)
    veil.visible = veilMat.opacity > 0.001
    // Going underground: daylight and the open-air fog ease into the corridor's (no switch — follows depth).
    // depth：0＝在地面上，1＝在地下，隨鏡頭高度連續變化。下面的天光、太陽、霧都用它 lerp，
    // 所以「進入地下」是連續變暗，不是切換場景。
    const depth = 1 - MathUtils.smoothstep(camera.position.y, -2, 1)
    inside = camera.position.y < -1
    sky.intensity = MathUtils.lerp(1.1, 0.3, depth)
    sun.intensity = MathUtils.lerp(2.1, 0.35, depth)
    fog.near = MathUtils.lerp(16, 4, depth)
    fog.far = MathUtils.lerp(36, 22, depth)

    // Idle motion (none for reduced motion): each fragment on its own amplitude / speed / spin.
    // 漂浮碎塊的閒置動畫：位置用 sin 做上下浮動，Y 軸慢慢自轉，X 軸輕微搖晃；t 是累積秒數，phase 讓每塊錯開。
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
    // 逐扇門更新：被預覽的門 amount 趨近 p（轉向鏡頭、解碼、框亮起），其他門趨近 0（轉回去、變暗）。
    // 同一個 amount 同時驅動：旋轉角度、不透明度、shader 的 uAmount、框的亮度、門內燈光，所以動作彼此同步，且中途切換也不會斷。
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

  // 〔回報給 HTML〕把每個作品門的 3D 位置，投影成螢幕上的像素座標，讓 HTML 標籤能貼在 3D 物件旁邊。
  function report() {
    const labels = stations.map((s) => {
      tmp.copy(s.anchor)
      // project(camera) 把世界座標轉成「標準化裝置座標」(−1 ~ 1)；下一個 return 裡再換算成像素：
      //   x = (nx + 1)/2 × 寬，y = (1 − ny)/2 × 高（螢幕 y 往下，所以要翻轉）。
      //   visible 同時要求：在地下、沒在進入、鏡頭在迴廊內、在畫面範圍內（tmp.z < 1 代表在鏡頭前方）。
      tmp.project(camera)
      return {
        slug: s.slug,
        x: (tmp.x + 1) / 2 * size.w,
        y: (1 - tmp.y) / 2 * size.h,
        // Underground only, never over the HTML text column on the left. Previewing a gate shows its label alone;
        // at the exploring spot every nearby gate is labelled.
        visible: inside && !entering && progress > 0.8 && progress <= 2 && (focused ? s.slug === focused : s.anchor.distanceTo(camera.position) < 16) &&
          tmp.z < 1 && tmp.x > -0.1 && tmp.x < 1.05 && Math.abs(tmp.y) < 1.05,
      }
    })
    tmp.subVectors(camera.position, cur.look)
    const projectedGuide = ruin.localToWorld(new Vector3(0, FLOOR - ARCHIVE_DROP + 0.012, ARCHIVE_Z - 6)).project(camera)
    const nearest = stations.reduce<(typeof stations)[number] | undefined>((best, station) => !best || Math.abs(station.stop - cur.s) < Math.abs(best.stop - cur.s) ? station : best, undefined)
    opts.onFrame({
      activeWork: progress >= 1 && progress <= 2 ? focused ?? nearest?.slug ?? null : null,
      guideX: MathUtils.clamp((projectedGuide.x + 1) / 2 * size.w, 0, size.w),
      guideY: MathUtils.clamp((1 - projectedGuide.y) / 2 * size.h, 0, size.h),
      archiveReady: reduced || (progress > 2 && cur.s >= IN + MOUTH - ZEND + 1),
      labels,
      azimuth: (MathUtils.radToDeg(Math.atan2(tmp.x, tmp.z)) + 360) % 360,
      elevation: MathUtils.radToDeg(Math.asin(tmp.y / tmp.length())),
    })
  }

  // 一幀 = 更新狀態 → 畫出來 → 回報給 HTML。
  function draw(dt: number) {
    update(dt)
    renderer.render(scene, camera)
    report()
  }

  // requestAnimationFrame 的回呼。dt 上限 1/20 秒：切回分頁時時間差可能好幾秒，不限制鏡頭會瞬移。
  // 只有「在畫面內且非減少動態」才排下一幀，其餘情況不跑迴圈、不耗電。
  function frame(now: number) {
    raf = 0
    const dt = Math.min((now - last) / 1000, 1 / 20)
    last = now
    draw(dt)
    if (visible && !reduced) raf = requestAnimationFrame(frame)
  }

  // 喚醒渲染迴圈：已在跑、不在畫面內、已釋放，都不重複啟動。
  function wake() {
    if (raf || !visible || disposed) return
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }

  /** Reduced motion renders on demand (snapped, no loop); otherwise make sure the loop runs. */
  // 「資料變了，請重畫」。減少動態時不跑迴圈，只在需要時畫一張靜態畫面；平常則確保迴圈在跑。
  function invalidate() {
    if (disposed) return
    if (reduced) draw(0)
    else wake()
  }

  // 滑鼠位置換算成 −1 ~ 1，讓鏡頭跟著滑鼠輕微環繞。觸控與減少動態時略過。{ passive: true } 告訴瀏覽器不會擋捲動。
  const onPointer = (e: PointerEvent) => {
    if (reduced || e.pointerType === 'touch') return
    pointer.x = (e.clientX / innerWidth) * 2 - 1
    pointer.y = (e.clientY / innerHeight) * 2 - 1
  }
  window.addEventListener('pointermove', onPointer, { passive: true })

  // ResizeObserver：容器大小改變時重新計算 canvas 尺寸並重畫。
  const resizeObserver = new ResizeObserver(() => {
    fit()
    invalidate()
  })
  resizeObserver.observe(host)

  // Off-screen: stop rendering entirely.
  // IntersectionObserver：畫面離開視窗就取消 requestAnimationFrame，完全停止渲染，回到畫面再 invalidate() 重啟。
  // `[entry]` 是解構，取陣列第一個元素；`!!entry?.isIntersecting` 轉成布林，且 entry 為空時不報錯。
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting
    if (visible) invalidate()
    else {
      cancelAnimationFrame(raf)
      raf = 0
    }
  })
  intersectionObserver.observe(host)

  // WebGL 上下文被瀏覽器收回時（顯卡忙碌、記憶體不足）：停止迴圈並通知外面，由外面改顯示 SVG 備援。
  const onContextLost = (e: Event) => {
    e.preventDefault()
    cancelAnimationFrame(raf)
    raf = 0
    enterDone?.()
    opts.onLost()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  const applyTheme = () => {
    const light = document.documentElement.dataset.theme !== 'dark'
    const background = light ? 0xf3f0e9 : BG
    renderer.setClearColor(background, 1)
    fog.color.set(background)
    landingMat.color.set(light ? 0xd2cbc0 : 0x292620)
    for (const slot of noteSlots) slot.material.color.copy(landingMat.color)
    stoneMat.color.set(light ? 0xe5d8c0 : 0xffffff)
    fragmentMat.color.copy(stoneMat.color)
    for (const fragment of drifting) fragment.mat.color.copy(stoneMat.color)
    signalMat.color.set(light ? 0xb83d0e : SIGNAL)
    ;(floor.material as MeshStandardMaterial).color.set(light ? 0xc8c2b6 : 0x22201d)
    ;(ground.material as MeshBasicMaterial).color.set(background)
    invalidate()
  }
  const themeObserver = new MutationObserver(applyTheme)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  applyTheme()
  fit()
  draw(0)
  wake()

  return {
    // 〔回傳物件：場景對外的操作〕符合上面的 SpaceScene 介面。外面只會呼叫這幾個方法。
    // setProgress：外面傳入捲動進度（夾在 0~1），場景只記下目標值，下一幀鏡頭自己去追。
    setProgress(p) {
      if (p > progress && progress >= 1 && progress < 2 && focused) {
        scrollAnchor = { progress, s: cur.s }
        focused = null
      }
      if (progress <= 2 && p > 2) departure = cur.s
      if (p < 1) scrollAnchor = null
      progress = MathUtils.clamp(p, 0, 4)
      invalidate()
    },
    focusNote(index) {
      focusedNote = index !== null && index >= 0 && index < noteSlots.length ? index : null
      invalidate()
    },
    focus(slug) {
      if (!slug && focused && progress >= 1 && progress < 2) scrollAnchor = { progress, s: cur.s }
      if (slug) scrollAnchor = null
      focused = slug
      invalidate()
    },
    // enter：開始穿越某作品。回傳 Promise，在截圖佔滿畫面時才 resolve；
    // 若減少動態、不在畫面內或找不到作品，直接 resolve，呼叫端不必等。
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
    // dispose：離開頁面時呼叫。取消迴圈、移除所有事件監聽與觀察器、釋放登記過的 GPU 資源、
    // 並用 forceContextLoss 主動交還 WebGL 上下文，canvas 最後從 DOM 移除。
    dispose() {
      disposed = true
      enterDone?.()
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      themeObserver.disconnect()
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
