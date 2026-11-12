// `v-elastic`: press and hold ONE spot of the image and pull: that spot rises like a bump of rubber and follows the pointer while the
// rest of the picture stays almost where it is; let go and the bump springs back with a wobble.
// How: while it is being pulled, the <img> is replaced by a WebGL canvas that draws the same picture on a mesh, and every mesh point
// moves toward the pointer by a bell-shaped amount (strongest at the grabbed spot, fading with distance). The canvas is larger than the
// image, so the bump can leave the frame instead of being clipped. Mouse and pen only (a touch drag has to keep scrolling the page);
// off for reduced motion or without WebGL.
type Elastic = HTMLElement & { _elastic?: () => void }

const PAD = 120 // css px of room around the image for the bump
const CELL = 8 // css px per mesh cell
const REACH = 150 // the most the grabbed spot can be pulled away from where it was grabbed (px), approached with resistance
const SIGMA = 62 // width of the bump when it is small (px); it widens a little as it is pulled further
const STIFFNESS = 170 // spring: higher = snappier
const DAMPING = 9 // spring: lower = more wobble

const VERT = `
attribute vec2 a_pos; attribute vec2 a_uv;
uniform vec2 u_size; uniform vec2 u_grab; uniform vec2 u_drag; uniform float u_sigma;
varying vec2 v_uv; varying float v_w;
void main() {
  vec2 d = a_pos - u_grab;
  float w = exp(-dot(d, d) / (2.0 * u_sigma * u_sigma));
  vec2 p = a_pos + u_drag * w;
  v_uv = a_uv; v_w = w;
  vec2 c = (p / u_size) * 2.0 - 1.0;
  gl_Position = vec4(c.x, -c.y, 0.0, 1.0);
}`
const FRAG = `
precision mediump float;
uniform sampler2D u_tex; uniform float u_light;
varying vec2 v_uv; varying float v_w;
void main() {
  vec4 c = texture2D(u_tex, v_uv);
  c.rgb += c.a * u_light * v_w * 0.14; // the raised spot catches a little light
  gl_FragColor = c;
}`

function shader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
  return s
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('elastic', {
    mounted(el: Elastic) {
      if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const img = el.querySelector('img')
      if (!img) return

      let canvas: HTMLCanvasElement | undefined
      let gl: WebGLRenderingContext | null = null
      let size = { w: 0, h: 0 }
      let loc: Record<string, WebGLUniformLocation | null> = {}
      let indexCount = 0
      let broken = false
      let active = false
      let down: { id: number; x: number; y: number; gx: number; gy: number } | null = null
      let raf = 0
      let last = 0
      const s = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, sig: SIGMA, tsig: SIGMA }
      let savedOverflow = ''

      const destroy = () => {
        canvas?.remove()
        canvas = undefined
        gl = null
        size = { w: 0, h: 0 }
      }

      // The picture as a texture: cropped like object-fit: cover, with the element's rounded corners baked in.
      const build = () => {
        const r = el.getBoundingClientRect()
        const w = Math.round(r.width)
        const h = Math.round(r.height)
        if (canvas && size.w === w && size.h === h) return true
        destroy()
        if (!w || !h || !img.complete || !img.naturalWidth) return false
        try {
          const dpr = Math.min(devicePixelRatio || 1, 2)
          const cw = w + PAD * 2
          const ch = h + PAD * 2
          canvas = document.createElement('canvas')
          canvas.width = Math.round(cw * dpr)
          canvas.height = Math.round(ch * dpr)
          canvas.setAttribute('aria-hidden', 'true')
          Object.assign(canvas.style, { position: 'absolute', left: `${-PAD}px`, top: `${-PAD}px`, width: `${cw}px`, height: `${ch}px`, pointerEvents: 'none', display: 'none' })
          el.append(canvas)
          gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true })
          if (!gl) throw new Error('no webgl')

          const tex = document.createElement('canvas')
          tex.width = Math.round(w * dpr)
          tex.height = Math.round(h * dpr)
          const c2 = tex.getContext('2d')!
          const radius = (parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0) * dpr
          c2.beginPath()
          if (c2.roundRect) c2.roundRect(0, 0, tex.width, tex.height, radius)
          else c2.rect(0, 0, tex.width, tex.height)
          c2.clip()
          const k = Math.max(tex.width / img.naturalWidth, tex.height / img.naturalHeight)
          const dw = img.naturalWidth * k
          const dh = img.naturalHeight * k
          c2.drawImage(img, (tex.width - dw) / 2, (tex.height - dh) / 2, dw, dh)

          const prog = gl.createProgram()!
          gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VERT))
          gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FRAG))
          gl.linkProgram(prog)
          if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link')
          gl.useProgram(prog)

          // mesh over the image rectangle (inside the larger canvas)
          const nx = Math.ceil(w / CELL)
          const ny = Math.ceil(h / CELL)
          const verts: number[] = []
          for (let j = 0; j <= ny; j++) {
            for (let i = 0; i <= nx; i++) {
              const u = i / nx
              const v = j / ny
              verts.push(PAD + u * w, PAD + v * h, u, v)
            }
          }
          const idx: number[] = []
          for (let j = 0; j < ny; j++) {
            for (let i = 0; i < nx; i++) {
              const a = j * (nx + 1) + i
              const b = a + 1
              const c = a + nx + 1
              const d = c + 1
              idx.push(a, b, c, b, d, c)
            }
          }
          indexCount = idx.length
          const vb = gl.createBuffer()
          gl.bindBuffer(gl.ARRAY_BUFFER, vb)
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW)
          const ib = gl.createBuffer()
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib)
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW)
          const aPos = gl.getAttribLocation(prog, 'a_pos')
          const aUv = gl.getAttribLocation(prog, 'a_uv')
          gl.enableVertexAttribArray(aPos)
          gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0)
          gl.enableVertexAttribArray(aUv)
          gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8)

          const t = gl.createTexture()
          gl.bindTexture(gl.TEXTURE_2D, t)
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
          gl.enable(gl.BLEND)
          gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
          loc = Object.fromEntries(['u_size', 'u_grab', 'u_drag', 'u_sigma', 'u_light'].map(n => [n, gl!.getUniformLocation(prog, n)]))
          gl.uniform2f(loc.u_size!, cw, ch)
          size = { w, h }
          return true
        }
        catch {
          broken = true // no WebGL (or it failed): the picture just stays a picture
          destroy()
          return false
        }
      }

      const draw = () => {
        if (!gl || !canvas) return
        const drag = Math.hypot(s.x, s.y)
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform2f(loc.u_grab!, down ? down.gx : lastGrab.x, down ? down.gy : lastGrab.y)
        gl.uniform2f(loc.u_drag!, s.x, s.y)
        gl.uniform1f(loc.u_sigma!, s.sig)
        gl.uniform1f(loc.u_light!, Math.min(drag / 90, 1))
        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0)
      }
      const lastGrab = { x: 0, y: 0 } // where the bump stays while it springs back

      const show = (on: boolean) => {
        if (on === active || !canvas) return
        active = on
        if (on) {
          draw() // first frame before the swap, so nothing blinks
          canvas.style.display = 'block'
          img.style.visibility = 'hidden'
          savedOverflow = el.style.overflow
          el.style.overflow = 'visible'
        }
        else {
          canvas.style.display = 'none'
          img.style.visibility = ''
          el.style.overflow = savedOverflow
        }
      }

      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.032)
        last = now
        s.vx += (STIFFNESS * (s.tx - s.x) - DAMPING * s.vx) * dt
        s.vy += (STIFFNESS * (s.ty - s.y) - DAMPING * s.vy) * dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.sig += (s.tsig - s.sig) * Math.min(1, dt * 12)
        if (!down && Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.vx) + Math.abs(s.vy) < 0.7) { // under a pixel of movement: nobody can see the rest of the wobble
          s.x = s.y = s.vx = s.vy = 0
          show(false)
          raf = 0
          return
        }
        draw()
        raf = requestAnimationFrame(tick)
      }
      const kick = () => {
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick) }
      }

      const ready = () => !broken && build()
      const onEnter = () => { ready() } // build while the pointer is merely over it, so the first press is instant
      const onDown = (e: PointerEvent) => {
        if (e.button !== 0 || e.pointerType === 'touch' || !ready() || !canvas) return
        e.preventDefault() // no native image drag
        const er = el.getBoundingClientRect() // the canvas is still hidden (no box yet): it sits PAD px outside the element
        down = { id: e.pointerId, x: e.clientX, y: e.clientY, gx: e.clientX - er.left + PAD, gy: e.clientY - er.top + PAD }
        lastGrab.x = down.gx
        lastGrab.y = down.gy
        s.tx = s.ty = 0
        s.sig = s.tsig = SIGMA
        try { el.setPointerCapture(e.pointerId) }
        catch { /* the pointer is gone already */ }
        show(true)
        kick()
      }
      const onMove = (e: PointerEvent) => {
        if (!down || e.pointerId !== down.id) return
        const rx = e.clientX - down.x
        const ry = e.clientY - down.y
        const m = Math.hypot(rx, ry)
        const k = m ? (REACH * Math.tanh(m / REACH)) / m : 0 // resistance: the further, the harder
        s.tx = rx * k
        s.ty = ry * k
        s.tsig = SIGMA + Math.hypot(s.tx, s.ty) * 0.3
        kick()
      }
      const onUp = (e: PointerEvent) => {
        if (!down || e.pointerId !== down.id) return
        try { el.releasePointerCapture(down.id) }
        catch { /* already released */ }
        down = null
        s.tx = s.ty = 0
        s.tsig = SIGMA
        kick() // the spring carries it home, with a wobble
      }
      const noDrag = (e: Event) => e.preventDefault()

      el.addEventListener('pointerenter', onEnter)
      el.addEventListener('pointerdown', onDown)
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerup', onUp)
      el.addEventListener('pointercancel', onUp)
      el.addEventListener('dragstart', noDrag)
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative'
      el._elastic = () => {
        cancelAnimationFrame(raf)
        el.removeEventListener('pointerenter', onEnter)
        el.removeEventListener('pointerdown', onDown)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerup', onUp)
        el.removeEventListener('pointercancel', onUp)
        el.removeEventListener('dragstart', noDrag)
        show(false)
        destroy()
      }
    },
    unmounted(el: Elastic) {
      el._elastic?.()
    },
    getSSRProps: () => ({}),
  })
})
