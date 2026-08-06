// Regenerates clean app icons (no wordmark text). The previous assets had a
// baked-in "opencode" wordmark that Android's adaptive-icon circular mask
// cropped/garbled on launchers (read as "pencod"). New glyph is just a
// terminal prompt: chevron ">" + underscore cursor "_". Uses pngjs only so it
// runs without new deps:  node scripts/gen-icon.mjs
import fs from "node:fs"
import { PNG } from "pngjs"

const BG = [15, 23, 42] // #0F172A (matches android adaptiveIcon.backgroundColor)

export function drawPrompt(size) {
  const squares = Array.from({ length: size }, () => new Float32Array(size))
  const cx = size / 2
  const stroke = Math.max(1, Math.round(size * 0.03))
  // Content metrics in size fractions so the whole glyph is truly centered.
  const chevronW = size * 0.44
  const chevronH = size * 0.2
  const gap = size * 0.08
  const cursorW = size * 0.4
  const cursorH = stroke
  const contentH = chevronH + gap + cursorH
  const top = (size - contentH) / 2
  // Chevron ">": three points — left-top, right-mid, left-bottom
  const pts = [
    [cx - chevronW / 2, top],
    [cx + chevronW / 2, top + chevronH / 2],
    [cx - chevronW / 2, top + chevronH],
  ]
  const cursorY = top + chevronH + gap
  for (const [x0, y0, x1, y1] of segs(pts)) {
    drawSegment(squares, x0, y0, x1, y1, stroke, size)
  }
  drawSegment(squares, cx - cursorW / 2, cursorY, cx + cursorW / 2, cursorY, stroke, size)
  return { squares, cx, size }
}

function segs(pts) {
  const out = []
  for (let i = 0; i < pts.length - 1; i++) out.push([...pts[i], ...pts[i + 1]])
  return out
}

function drawSegment(dst, x0, y0, x1, y1, stroke, size) {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1
  const steps = Math.max(2, Math.round(len))
  const nx = -(y1 - y0) / len
  const ny = (x1 - x0) / len
  const r = stroke / 2
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    const px = x0 + (x1 - x0) * t
    const py = y0 + (y1 - y0) * t
    for (let oy = -r; oy <= r; oy++) {
      for (let ox = -r; ox <= r; ox++) {
        if (ox * ox + oy * oy > r * r) continue
        const X = Math.round(px + nx * ox)
        const Y = Math.round(py + ny * oy)
        if (X >= 0 && X < size && Y >= 0 && Y < size) dst[Y][X] = 1
      }
    }
  }
}

function writeIcon(file, squares, size, transparent = false) {
  const png = new PNG({ width: size, height: size })
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r, g, b, a
      if (transparent) {
        r = g = b = 0
        a = squares[y][x] ? 255 : 0
      } else {
        r = BG[0]; g = BG[1]; b = BG[2]
        // Full opaque square. iOS applies its own mask at export; Android
        // renders adaptive-icon.png for launchers. Transparent pixels here
        // would fail App Store validation ("Alpha is not an allowable value").
        a = 255
        if (squares[y][x]) { r = 134; g = 239; b = 172 } // #86EFAC light mint prompt
      }
      const o = (y * size + x) * 4
      png.data[o] = r; png.data[o + 1] = g; png.data[o + 2] = b; png.data[o + 3] = a
    }
  }
  fs.writeFileSync(file, PNG.sync.write(png))
  console.log("wrote", file, size + "x" + size)
}

// --- generate ---
const geometry = (size) => ({ squares: drawPrompt(size).squares, size })
for (const [file, size, transparent] of [
  ["assets/icon.png", 1024, false],
  ["assets/adaptive-icon.png", 432, true],
  ["assets/splash-icon.png", 200, true],
  ["assets/icon-appstore.png", 1024, false],
]) {
  const g = geometry(size)
  writeIcon(file, g.squares, g.size, transparent)
}