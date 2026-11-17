// "Stepped digital ruin" — the signature object of the home page, described as voxel blocks (integer grid,
// y = layer from the ground). Shared by the WebGL scene (lib/space-scene.ts) and the static SVG drawing
// (components/space/Monument.vue), so both show exactly the same object.
//
//   · a four-tier ziggurat (9×9 → 7×7 → 5×5 → 3×3);
//   · one corner (+x, −z) has crumbled away — the missing blocks float above it as drifting fragments;
//   · a central stair on the +z face, marked with orange inlays, leads to a gate on the summit.
// ===== 中文導讀：本檔只描述「遺跡長什麼樣」，用方塊的整數格線座標表示，不含任何 three.js 程式。=====
// 3D 場景（space-scene.ts）與 SVG 備援（Monument.vue）共用這份資料，所以兩邊畫的是同一個物體。
// 座標：x、z 是水平格，y 是從地面往上第幾層。RUIN_UNIT = 一個方塊邊長（公尺）；RUIN_LEVELS = 階梯層數。
export const RUIN_UNIT = 0.42
export const RUIN_LEVELS = 4

// 一顆方塊的格線座標；glyph? 的 ? 表示可有可無，只有階梯上的方塊會標 true（用來畫橘色嵌條）。
export interface Block { x: number; y: number; z: number; glyph?: boolean }
// `rank` 0 → 1: from just broken off (low, near the bite) to fully drifted. The top few are `decoded`
// (orange outline): the eye meets the collapse first, the decoding last.
// 〔interface extends〕碎塊 = 一般方塊 + 額外欄位：rx / ry 初始旋轉、phase 浮動相位、rank 漂浮程度、decoded 是否畫橘框。
export interface Fragment extends Block { rx: number; ry: number; phase: number; rank: number; decoded: boolean }
// 最上面（飄最高）的 3 塊碎塊畫橘色外框，讓視線先看到崩落，最後才看到「解碼」。
export const DECODED_FRAGMENTS = 3
// Fragment clearance around the summit door: pillars reach |x| = 2.5 and the lintel's top is y = RUIN_LEVELS + 4;
// add a fragment's spin half-diagonal + bob.
// 石門周圍的「禁飛區」：碎塊不能飄進門前、門框與門楣上方，否則會擋住門。數字已含碎塊自轉與浮動的餘量。
const CLEAR_X = 3.4
const LINTEL_CLEAR = RUIN_LEVELS + 4.9

/** Deterministic 0..1 hash of an integer triple (same object on every load, server and client). */
// 〔確定性偽隨機〕輸入整數座標，輸出 0~1 的小數：sin 乘大數再取小數部分。
// 同樣輸入永遠得同樣輸出，所以伺服器與每次載入的遺跡都一模一樣（不能用 Math.random()）。
// space-scene.ts 的 GLSL 裡有同樣原理的 h3()。
export function hash(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return s - Math.floor(s)
}

// 產生遺跡的所有方塊。回傳 solid（保持完整的）與 fragments（崩落後漂浮的碎塊）。
export function ruinBlocks() {
  const solid: Block[] = []
  const fallen: Block[] = []
  for (let y = 0; y < RUIN_LEVELS; y++) {
    // 每往上一層，邊長縮 1：第 0 層 r = 4（9×9 格），然後 7×7、5×5、3×3，形成階梯塔。三層巢狀 for 走訪該層每一格。
    const r = RUIN_LEVELS - y // 9×9, 7×7, 5×5, 3×3
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        // 正面（+z）中線上的一排方塊是階梯，永遠保留，不會崩落。
        const stair = x === 0 && z === r // the stair path stays intact
        // The crumbled corner: a diagonal bite into +x / −z, deeper toward the top.
        // 崩落判定：x − z + y·1.1 > 4.6 + 隨機擾動，這是一道「斜切平面」，把 +x、−z 方向的角咬掉；
        // 越往上（y 越大）咬得越深。hash 擾動讓咬痕邊緣不規則。一個不等式就決定了哪些方塊掉落，不用手動挑。
        const bite = x - z + y * 1.1 > 4.6 + hash(x, y, z) * 1.8
        // A few loose stones along the outer ring.
        // 外圈上約 5% 的石頭鬆動（hash < 0.05），也算掉落，讓塔身其他地方也有零星缺口。
        const loose = y < RUIN_LEVELS - 1 && (Math.abs(x) === r || Math.abs(z) === r) && hash(z, x, y) < 0.05
        // 掉落的放進 fallen，其餘放進 solid；階梯方塊保留並標記 glyph。
        if (!stair && (bite || loose)) fallen.push({ x, y, z })
        else solid.push({ x, y, z, glyph: stair })
      }
    }
  }
  // Fallen blocks drift above the broken corner, highest-first so the stream reads upward.
  // 只取前 16 塊掉落的石頭變成空中漂浮碎塊（slice 取陣列前 16 個），其餘直接消失。
  const drifting = fallen.slice(0, 16)
  // .map 把每塊掉落的方塊轉成一個 Fragment：位置上移並隨機偏移（飄在崩落口上方），rank 依序 0→1 代表漂得越來越遠。
  const fragments: Fragment[] = drifting.map((b, i) => {
    const x = b.x + 0.6 + hash(i, 1, 2) * 1.2
    // y 用 let 是因為下面可能要改。位置 = 原位 + 固定上移 + 序號累加 + 隨機量，形成往上斜升的碎塊流。
    let y = b.y + 1.6 + i * 0.18 + hash(i, 3, 4) * 0.6
    const z = b.z - 0.6 - hash(i, 5, 6) * 1.2
    // Keep clear of the summit door, its landing and the stairway descending behind it (|x| < 2.5 blocks, up to
    // the lintel): a fragment that would float there rises above the lintel instead, so the stream carries on
    // upward over the door rather than piling up beside it (with room for its bob and spin, half-diagonal ≈ 0.8).
    // 若碎塊落進石門禁飛區，就把它抬到門楣上方，讓整條碎塊流繞過石門往上延伸，而不是堆在門旁。
    if (Math.abs(x) < CLEAR_X && z < 2 && y < LINTEL_CLEAR) y = LINTEL_CLEAR + (i / drifting.length) * 0.7 + hash(i, 4, 7) * 0.3
    return {
      // 回傳碎塊資料：位置，rx/ry 初始旋轉、phase 浮動相位、rank 漂浮程度、decoded 最後 3 塊為 true（畫橘框）。每個值都由 hash 決定，所以固定。
      x, y, z,
      rx: hash(i, 7, 8) * 0.9,
      ry: hash(i, 9, 1) * 1.6,
      phase: hash(i, 2, 9) * Math.PI * 2,
      rank: drifting.length > 1 ? i / (drifting.length - 1) : 1,
      decoded: i >= drifting.length - DECODED_FRAGMENTS,
    }
  })
  // 物件簡寫：等同 { solid: solid, fragments: fragments }。
  return { solid, fragments }
}

/**
 * Summit gate, opening toward +z (the stair): a 3×3-block doorway framed by pillars standing on the 5×5 tier
 * either side of the summit, two blocks deep, under a lintel. Big and deep enough to read as a door (not a slit)
 * from the hero camera; the 3D scene continues it into a stairway down to the corridor.
 */
// 〔山頂石門〕朝 +z（階梯方向）開口的 3×3 方塊門洞，深度 2 格：兩側各一排柱子，加一排門楣。
// `for (const z of [0, -1])` 走訪兩層深度；GATE.push(A, B) 一次推入左右兩根柱子的方塊。
export const GATE: Block[] = []
for (const z of [0, -1]) {
  for (let y = RUIN_LEVELS - 1; y <= RUIN_LEVELS + 2; y++) GATE.push({ x: -2, y, z }, { x: 2, y, z })
  for (let x = -2; x <= 2; x++) GATE.push({ x, y: RUIN_LEVELS + 3, z })
}
