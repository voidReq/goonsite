'use client'

import { useEffect } from 'react'
import Head from 'next/head'

// This page ports your standalone HTML into a Next.js client component.
// It dynamically loads Math.js, Plotly, and KaTeX (CSS) and then mounts
// the same UI/logic into the rendered DOM.
//
// Notes:
// - Kept the original IDs and imperative DOM logic for parity with your HTML.
// - Styles are scoped via <style jsx global> to preserve your look & feel.
// - If you already include KaTeX CSS globally in your app, you can remove the <Head> link below.

export default function Page() {
  useEffect(() => {
    // ------- helpers to lazy‑load libs (mirrors your HTML version) -------
    function ensureMathLoaded() {
      return new Promise<void>((resolve, reject) => {
        if ((window as any).math) return resolve()
        const s = document.createElement('script')
        s.src = 'https://cdn.jsdelivr.net/npm/mathjs@13.2.0/lib/browser/math.min.js'
        s.onload = () => (window as any).math ? resolve() : reject(new Error('math.js missing'))
        s.onerror = () => reject(new Error('Failed to load math.js'))
        document.head.appendChild(s)
      })
    }
    function ensurePlotlyLoaded() {
      return new Promise<void>((resolve, reject) => {
        if ((window as any).Plotly) return resolve()
        const s = document.createElement('script')
        s.src = 'https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2.32.0/plotly.min.js'
        s.onload = () => (window as any).Plotly ? resolve() : reject(new Error('Plotly missing'))
        s.onerror = () => reject(new Error('Failed to load Plotly'))
        document.head.appendChild(s)
      })
    }

    function setStatus(msg: string, ok?: boolean) {
      const el = document.getElementById('statusBox')
      if (!el) return
      el.innerHTML = msg
      el.classList.toggle('ok', !!ok)
      el.classList.toggle('bad', ok === false)
    }

    // Globals from original file
    let autoAnimating = false,
      lastTime = 0,
      currentDeg = 360
    let fixedRanges: { xr: number[] | null; yr: number[] | null; zr: number[] | null } | null = null

    function initApp() {
      const math = (window as any).math
      const Plotly = (window as any).Plotly
      const katex = (window as any).katex

      const el = {
        // tabs
        tabSurface: document.getElementById('tab-surface') as HTMLButtonElement,
        tabRotate: document.getElementById('tab-rotate') as HTMLButtonElement,
        sectionSurface: document.getElementById('section-surface') as HTMLElement,
        sectionRotate: document.getElementById('section-rotate') as HTMLElement,
        // surface
        formula: document.getElementById('formula') as HTMLTextAreaElement,
        xmin: document.getElementById('xmin') as HTMLInputElement,
        xmax: document.getElementById('xmax') as HTMLInputElement,
        ymin: document.getElementById('ymin') as HTMLInputElement,
        ymax: document.getElementById('ymax') as HTMLInputElement,
        steps: document.getElementById('steps') as HTMLInputElement,
        colorscale: document.getElementById('colorscale') as HTMLSelectElement,
        contours: document.getElementById('contours') as HTMLSelectElement,
        wireframe: document.getElementById('wireframe') as HTMLSelectElement,
        plotBtn: document.getElementById('plotBtn') as HTMLButtonElement,
        resetView: document.getElementById('resetView') as HTMLButtonElement,
        exportBtn: document.getElementById('exportBtn') as HTMLButtonElement,
        // rotate
        rotForm: document.getElementById('rot-form') as HTMLSelectElement,
        rotAxisType: document.getElementById('rot-axis-type') as HTMLSelectElement,
        rotExpr: document.getElementById('rot-expr') as HTMLInputElement,
        rotMin: document.getElementById('rot-min') as HTMLInputElement,
        rotMax: document.getElementById('rot-max') as HTMLInputElement,
        rotAxis: document.getElementById('rot-axis') as HTMLInputElement,
        rotSteps: document.getElementById('rot-steps') as HTMLInputElement,
        rotThetaSteps: document.getElementById('rot-theta-steps') as HTMLInputElement,
        rotScale: document.getElementById('rot-scale') as HTMLSelectElement,
        rotPhi: document.getElementById('rot-phi') as HTMLInputElement,
        rotPhiLabel: document.getElementById('rot-phi-label') as HTMLElement,
        rotAuto: document.getElementById('rot-auto') as HTMLInputElement,
        rotSpeed: document.getElementById('rot-speed') as HTMLInputElement,
        rotPlot: document.getElementById('rot-plot') as HTMLButtonElement,
        rotReset: document.getElementById('rot-reset') as HTMLButtonElement,
        rotExport: document.getElementById('rot-export') as HTMLButtonElement,
        // shared
        plotDiv: document.getElementById('plot') as HTMLDivElement,
        // pretty
        rotExprPretty: document.getElementById('rot-expr-pretty') as HTMLDivElement,
        // tests
        diag: document.getElementById('diag') as HTMLDivElement,
        runTests: document.getElementById('runTests') as HTMLButtonElement | null,
      }

      // Tabs
      function activate(section: 'surface' | 'rotate') {
        ;[el.sectionSurface, el.sectionRotate].forEach((sec) => sec.classList.remove('active'))
        ;[el.tabSurface, el.tabRotate].forEach((t) => t.classList.remove('active'))
        if (section === 'surface') {
          el.sectionSurface.classList.add('active')
          el.tabSurface.classList.add('active')
        } else {
          el.sectionRotate.classList.add('active')
          el.tabRotate.classList.add('active')
        }
        Plotly.Plots.resize(el.plotDiv)
      }
      el.tabSurface.addEventListener('click', () => activate('surface'))
      el.tabRotate.addEventListener('click', () => activate('rotate'))

      // Helpers
      const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
      function renderPrettyExpr(expr: string) {
        if (!katex || !el.rotExprPretty) return
        try {
          const node = math.parse(expr)
          const tex = node.toTex({ parenthesis: 'auto' })
          katex.render(tex, el.rotExprPretty, { throwOnError: false })
        } catch {
          el.rotExprPretty.textContent = expr
        }
      }

      // Surface
      function generateGrid(xmin: number, xmax: number, ymin: number, ymax: number, steps: number) {
        steps = clamp((steps as any) | 0, 10, 400)
        const xs: number[] = [],
          ys: number[] = []
        const dx = (xmax - xmin) / (steps - 1)
        const dy = (ymax - ymin) / (steps - 1)
        for (let i = 0; i < steps; i++) xs.push(xmin + i * dx)
        for (let j = 0; j < steps; j++) ys.push(ymin + j * dy)
        return { xs, ys }
      }
      function evalSurface(expr: string, xs: number[], ys: number[]) {
        const z = new Array(ys.length)
        let code: any
        try {
          code = math.parse(expr).compile()
        } catch (parseErr: any) {
          throw new Error('Parse error: ' + parseErr.message)
        }
        for (let j = 0; j < ys.length; j++) {
          const row = new Array(xs.length)
          for (let i = 0; i < xs.length; i++) {
            let val = NaN
            try {
              val = code.evaluate({ x: xs[i], y: ys[j], pi: Math.PI, e: Math.E })
              if (!isFinite(val)) val = NaN
            } catch (_) {
              val = NaN
            }
            row[i] = isNaN(val) ? null : val
          }
          z[j] = row
        }
        return z
      }
      function contourConfig(mode: string) {
        const C: any = { x: { show: false }, y: { show: false }, z: { show: false } }
        if (mode === 'z' || mode === 'xyz') C.z = { show: true, usecolormap: true, highlight: true }
        if (mode === 'xy' || mode === 'xyz') {
          C.x = { show: true, usecolormap: true, highlight: true }
          C.y = { show: true, usecolormap: true, highlight: true }
        }
        return C
      }
      function baseLayout() {
        return {
          margin: { l: 10, r: 10, b: 10, t: 10 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          scene: {
            xaxis: { title: 'x', gridcolor: '#24324a', zerolinecolor: '#31507a', color: '#cfe0ff' },
            yaxis: { title: 'y', gridcolor: '#24324a', zerolinecolor: '#31507a', color: '#cfe0ff' },
            zaxis: { title: 'z', gridcolor: '#24324a', zerolinecolor: '#31507a', color: '#cfe0ff' },
            aspectmode: 'cube',
            camera: { eye: { x: 1.6, y: 1.6, z: 1.2 } },
          },
        }
      }
      function plotSurface() {
        const expr = el.formula.value.trim()
        const xmin = parseFloat(el.xmin.value),
          xmax = parseFloat(el.xmax.value)
        const ymin = parseFloat(el.ymin.value),
          ymax = parseFloat(el.ymax.value)
        const steps = parseInt(el.steps.value, 10)
        if (!(xmax > xmin && ymax > ymin)) {
          alert('Check your domain: ensure max > min for both x and y.')
          return
        }
        let xs, ys, Z
        try {
          ;({ xs, ys } = generateGrid(xmin, xmax, ymin, ymax, steps))
          Z = evalSurface(expr, xs, ys)
        } catch (err: any) {
          console.error(err)
          alert('There was an error evaluating your formula. ' + err.message)
          return
        }
        const surfaceMode = el.wireframe && el.wireframe.value === 'mesh' ? 'mesh3d' : 'surface'
        let trace: any
        if (surfaceMode === 'surface') {
          trace = {
            type: 'surface',
            x: xs,
            y: ys,
            z: Z,
            colorscale: (el.colorscale as HTMLSelectElement).value,
            showscale: true,
            contours: contourConfig(el.contours ? (el.contours as HTMLSelectElement).value : 'none'),
            lighting: { ambient: 0.6, diffuse: 0.7, specular: 0.2, roughness: 0.6 },
            hovertemplate: 'x=%{x:.3f}<br>y=%{y:.3f}<br>z=%{z:.3f}<extra></extra>',
          }
        } else {
          const verts: number[] = []
          for (let j = 0; j < ys.length; j++) {
            for (let i = 0; i < xs.length; i++) {
              const zv = Z[j][i]
              if (zv === null) verts.push(NaN, NaN, NaN)
              else verts.push(xs[i], ys[j], zv)
            }
          }
          const nX = xs.length,
            nY = ys.length
          const I: number[] = [],
            J: number[] = [],
            K: number[] = []
          for (let j = 0; j < nY - 1; j++) {
            for (let i = 0; i < nX - 1; i++) {
              const a = j * nX + i,
                b = a + 1,
                c = a + nX,
                d = c + 1
              I.push(a, a, b)
              J.push(c, d, d)
              K.push(b, c, c)
            }
          }
          const X = verts.filter((_, idx) => idx % 3 === 0)
          const Y = verts.filter((_, idx) => idx % 3 === 1)
          const Zs = verts.filter((_, idx) => idx % 3 === 2)
          trace = {
            type: 'mesh3d',
            x: X,
            y: Y,
            z: Zs,
            i: I,
            j: J,
            k: K,
            intensity: Zs,
            colorscale: (el.colorscale as HTMLSelectElement).value,
            showscale: true,
            opacity: 1.0,
            hovertemplate: 'x=%{x:.3f}<br>y=%{y:.3f}<br>z=%{z:.3f}<extra></extra>',
          }
        }
        const layout: any = baseLayout()
        ;(window as any).Plotly.react(el.plotDiv, [trace], layout, { responsive: true, displaylogo: false })
      }

      // Rotations
      function updatePhiLabel() {
        const deg = parseFloat(el.rotPhi.value)
        const rad = (deg * Math.PI) / 180
        el.rotPhiLabel.textContent = Math.abs(rad - 2 * Math.PI) < 1e-10 ? '2π rad' : rad.toFixed(3) + ' rad'
      }
      function buildRotationGrid(
        form: 'yfx' | 'xgy',
        axisType: 'x' | 'y',
        expr: string,
        tmin: number,
        tmax: number,
        c: number,
        nCurve: number,
        nTheta: number,
        phiDeg: number
      ) {
        const f = math.parse(expr).compile()
        const U = Array.from({ length: nCurve }, (_, i) => tmin + ((tmax - tmin) * i) / (nCurve - 1))
        const phi = Math.max(0, Math.min(360, phiDeg)) * (Math.PI / 180)
        const V = Array.from({ length: nTheta }, (_, j) => (phi * j) / (nTheta - 1))
        const X: (number | null)[][] = [],
          Y: (number | null)[][] = [],
          Z: (number | null)[][] = []
        for (let j = 0; j < nTheta; j++) {
          const th = V[j],
            cost = Math.cos(th),
            sint = Math.sin(th)
          const rowX: (number | null)[] = [],
            rowY: (number | null)[] = [],
            rowZ: (number | null)[] = []
          for (let i = 0; i < nCurve; i++) {
            const u = U[i]
            if (form === 'yfx') {
              let yv: number
              try {
                yv = f.evaluate({ x: u, pi: Math.PI, e: Math.E })
              } catch {
                yv = NaN as any
              }
              if (!Number.isFinite(yv)) {
                rowX.push(null)
                rowY.push(null)
                rowZ.push(null)
                continue
              }
              if (axisType === 'y') {
                const r = yv - c
                rowX.push(u)
                rowY.push(c + r * cost)
                rowZ.push(r * sint)
              } else {
                const r = u - c
                rowX.push(c + r * cost)
                rowY.push(yv)
                rowZ.push(r * sint)
              }
            } else {
              let xv: number
              try {
                xv = f.evaluate({ y: u, pi: Math.PI, e: Math.E })
              } catch {
                xv = NaN as any
              }
              if (!Number.isFinite(xv)) {
                rowX.push(null)
                rowY.push(null)
                rowZ.push(null)
                continue
              }
              if (axisType === 'x') {
                const r = xv - c
                rowX.push(c + r * cost)
                rowY.push(u)
                rowZ.push(r * sint)
              } else {
                const r = u - c
                rowX.push(xv)
                rowY.push(c + r * cost)
                rowZ.push(r * sint)
              }
            }
          }
          X.push(rowX)
          Y.push(rowY)
          Z.push(rowZ)
        }
        return { X, Y, Z }
      }
      function currentRanges() {
        const sc = (el.plotDiv && (el.plotDiv as any).layout && (el.plotDiv as any).layout.scene) || {}
        const xr = sc.xaxis && sc.xaxis.range ? sc.xaxis.range.slice() : null
        const yr = sc.yaxis && sc.yaxis.range ? sc.yaxis.range.slice() : null
        const zr = sc.zaxis && sc.zaxis.range ? sc.zaxis.range.slice() : null
        return { xr, yr, zr }
      }
      function applyRangesToLayout(layout: any, ranges: any) {
        layout.scene = layout.scene || {}
        layout.scene.xaxis = layout.scene.xaxis || {}
        layout.scene.yaxis = layout.scene.yaxis || {}
        layout.scene.zaxis = layout.scene.zaxis || {}
        if (ranges.xr) {
          layout.scene.xaxis.range = ranges.xr
          layout.scene.xaxis.autorange = false
        }
        if (ranges.yr) {
          layout.scene.yaxis.range = ranges.yr
          layout.scene.yaxis.autorange = false
        }
        if (ranges.zr) {
          layout.scene.zaxis.range = ranges.zr
          layout.scene.zaxis.autorange = false
        }
      }
      function plotRotation() {
        const form = (el.rotForm.value as 'yfx' | 'xgy')
        const axisType = (el.rotAxisType.value as 'x' | 'y')
        const expr = el.rotExpr.value.trim()
        const tmin = parseFloat(el.rotMin.value)
        const tmax = parseFloat(el.rotMax.value)
        const c = parseFloat(el.rotAxis.value)
        const nCurve = clamp(parseInt(el.rotSteps.value, 10), 10, 1000)
        const nTheta = clamp(parseInt(el.rotThetaSteps.value, 10), 16, 720)
        const deg = parseFloat(el.rotPhi.value)
        if (!(tmax > tmin)) {
          alert('Check your parameter domain: end must be greater than start.')
          return
        }

        let X, Y, Z
        try {
          ;({ X, Y, Z } = buildRotationGrid(form, axisType, expr, tmin, tmax, c, nCurve, nTheta, deg))
        } catch (err: any) {
          console.error(err)
          alert('Error building rotation: ' + err.message)
          return
        }

        const trace = {
          type: 'surface',
          x: X,
          y: Y,
          z: Z,
          colorscale: (el.rotScale as HTMLSelectElement).value,
          showscale: true,
          hovertemplate: 'x=%{x:.3f}<br>y=%{y:.3f}<br>z=%{z:.3f}<extra></extra>',
        } as any
        const layout: any = baseLayout()
        const rangesToUse = fixedRanges || currentRanges()
        applyRangesToLayout(layout, rangesToUse)
        Plotly.react(el.plotDiv, [trace], layout, { responsive: true, displaylogo: false }).then(() => {
          if (!fixedRanges) {
            fixedRanges = currentRanges()
          }
        })
      }

      // Animation
      function tick(ts: number) {
        if (!autoAnimating) {
          lastTime = ts
          return
        }
        const dt = (ts - lastTime) / 1000
        lastTime = ts
        const speed = parseFloat(el.rotSpeed.value) || 90
        currentDeg += speed * dt
        if (currentDeg > 360) currentDeg -= 360
        el.rotPhi.value = String(currentDeg)
        updatePhiLabel()
        plotRotation()
        requestAnimationFrame(tick)
      }

      // Wire up surface
      el.plotBtn.addEventListener('click', plotSurface)
      el.resetView.addEventListener('click', () => {
        fixedRanges = null
        Plotly.relayout(el.plotDiv, { 'scene.camera': { eye: { x: 1.6, y: 1.6, z: 1.2 } } })
      })
      el.exportBtn.addEventListener('click', () =>
        Plotly.downloadImage(el.plotDiv, { format: 'png', width: 1600, height: 1200, filename: '3d-surface' })
      )

      // Wire up rotations
      el.rotExpr.addEventListener('input', () => renderPrettyExpr(el.rotExpr.value))
      renderPrettyExpr(el.rotExpr.value)
      el.rotPhi.addEventListener('input', () => {
        updatePhiLabel()
        plotRotation()
      })
      el.rotPlot.addEventListener('click', () => {
        fixedRanges = null
        plotRotation()
      })
      el.rotReset.addEventListener('click', () => {
        fixedRanges = null
        Plotly.relayout(el.plotDiv, { 'scene.camera': { eye: { x: 1.6, y: 1.6, z: 1.2 } } })
      })
      el.rotExport.addEventListener('click', () =>
        (window as any).Plotly.downloadImage(el.plotDiv, {
          format: 'png',
          width: 1600,
          height: 1200,
          filename: 'rotation',
        })
      )
      el.rotAuto.addEventListener('change', () => {
        autoAnimating = el.rotAuto.checked
        if (autoAnimating) {
          currentDeg = 0
          lastTime = performance.now()
          requestAnimationFrame(tick)
        }
      })

      // Diagnostics & tests (optional)
      function runTests() {
        const out: string[] = []
        const ok = (s: string) => `<div style='color:#b2ffb2'>✔ ${s}</div>`
        const bad = (s: string) => `<div style='color:#ffb2b2'>✖ ${s}</div>`
        try {
          const v1 = (window as any).math.parse('sin(0)').compile().evaluate()
          out.push(v1 === 0 ? ok('math.js works: sin(0)=0') : bad('math.js wrong sin(0)'))
        } catch (e: any) {
          out.push(bad('math.js not available: ' + e.message))
        }
        try {
          const { X, Y, Z } = buildRotationGrid('yfx', 'y', '1', 0, 1, 0, 8, 36, 360)
          const r = Math.hypot((Y as any)[10][3] - 0, (Z as any)[10][3] - 0)
          out.push(Math.abs(r - 1) < 1e-9 ? ok('rotation: y=1 about y=0 gives radius 1') : bad('rotation cylinder radius ≠ 1'))
        } catch (e: any) {
          out.push(bad('rotation test failed: ' + e.message))
        }
        try {
          fixedRanges = null
          plotRotation()
          setTimeout(() => {
            const before = currentRanges()
            ;(document.getElementById('rot-phi') as HTMLInputElement).value = '90'
            updatePhiLabel()
            plotRotation()
            setTimeout(() => {
              const after = currentRanges()
              const same = JSON.stringify(before) === JSON.stringify(after)
              const diag = document.getElementById('diag')
              if (diag) diag.innerHTML = (out.concat(same ? ok('axis ranges fixed while changing angle') : bad('axis ranges changed when angle changed'))).join('')
            }, 40)
          }, 40)
        } catch (e: any) {
          out.push(bad('axis range test failed: ' + e.message))
        }
        try {
          const hasControls = document.getElementById('wireframe') && document.getElementById('contours')
          const diag = document.getElementById('diag')
          if (diag) diag.innerHTML = out.concat(hasControls ? ok('surface controls present (wireframe & contours)') : bad('missing surface controls')).join('')
        } catch (e: any) {}
        try {
          plotSurface()
        } catch (e: any) {}
      }
      if (el.runTests) el.runTests.addEventListener('click', runTests)

      // Initial
      plotSurface()
      updatePhiLabel()
      renderPrettyExpr(el.rotExpr.value)
    }

    // boot
    ;(async () => {
      try {
        setStatus('Loading libraries…')
        await ensurePlotlyLoaded()
        await ensureMathLoaded()
        setStatus('Libraries loaded ✔️', true)
        initApp()
      } catch (err: any) {
        console.error(err)
        setStatus('Error loading libraries: ' + err.message, false)
        const plotDiv = document.getElementById('plot')
        if (plotDiv) {
          plotDiv.innerHTML =
            '<div style="padding:16px">⚠️ Unable to load required libraries. Check your network or try again.</div>'
        }
      }
    })()
  }, [])

  return (
    <>
      <Head>
        {/* KaTeX CSS for pretty math (rendered client-side via katex.render) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
        />
      </Head>

      <header>
        <h1>3D Grapher — Surface & Rotations</h1>
        <small>Rotation angle only reveals more of the surface; camera and axis bounds stay fixed.</small>
      </header>

      <div className="wrap">
        <aside className="panel">
          <div className="controls">
            <div className="status" id="statusBox">Loading libraries…</div>

            <div className="tabs">
              <button className="tab active" id="tab-surface">Surface</button>
              <button className="tab" id="tab-rotate">Rotations</button>
            </div>

            {/* Surface */}
            <section id="section-surface" className="section active">
              <h3>Surface z = f(x,y)</h3>
              <label htmlFor="formula">z =</label>
              <textarea id="formula" defaultValue="sin(sqrt(x^2 + y^2))" />
              <div className="row">
                <div>
                  <label>x min</label>
                  <input type="number" id="xmin" defaultValue={-6} step={0.5} />
                </div>
                <div>
                  <label>x max</label>
                  <input type="number" id="xmax" defaultValue={6} step={0.5} />
                </div>
              </div>
              <div className="row">
                <div>
                  <label>y min</label>
                  <input type="number" id="ymin" defaultValue={-6} step={0.5} />
                </div>
                <div>
                  <label>y max</label>
                  <input type="number" id="ymax" defaultValue={6} step={0.5} />
                </div>
              </div>
              <div className="row">
                <div>
                  <label>Resolution</label>
                  <input type="number" id="steps" defaultValue={60} />
                </div>
                <div>
                  <label>Colors</label>
                  <select id="colorscale" defaultValue="Viridis">
                    <option>Viridis</option>
                    <option>Cividis</option>
                    <option>Inferno</option>
                    <option>Magma</option>
                    <option>Jet</option>
                    <option>Rainbow</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div>
                  <label>Contours</label>
                  <select id="contours" defaultValue="none">
                    <option value="none">None</option>
                    <option value="z">On Z</option>
                    <option value="xy">On X & Y</option>
                    <option value="xyz">On X, Y & Z</option>
                  </select>
                </div>
                <div>
                  <label>Style</label>
                  <select id="wireframe" defaultValue="surface">
                    <option value="surface">Smooth</option>
                    <option value="mesh">Wireframe</option>
                  </select>
                </div>
              </div>
              <div className="btns">
                <button id="plotBtn">Plot</button>
                <button id="resetView">Reset View</button>
                <button id="exportBtn" className="secondary">Export PNG</button>
              </div>
            </section>

            {/* Rotations */}
            <section id="section-rotate" className="section">
              <h3>Rotations — curve → surface</h3>
              <div className="row">
                <div>
                  <label>Curve form</label>
                  <select id="rot-form" defaultValue="yfx">
                    <option value="yfx">y = f(x)</option>
                    <option value="xgy">x = g(y)</option>
                  </select>
                </div>
                <div>
                  <label>Rotate about</label>
                  <select id="rot-axis-type" defaultValue="y">
                    <option value="y">y = c</option>
                    <option value="x">x = c</option>
                  </select>
                </div>
              </div>
              <label htmlFor="rot-expr">Expression</label>
              <input id="rot-expr" type="text" defaultValue="4*sin(x)" />
              <div id="rot-expr-pretty" className="pretty" />
              <div className="row">
                <div>
                  <label>Parameter start</label>
                  <input id="rot-min" type="number" defaultValue={-6.283185307179586} step={0.5} />
                </div>
                <div>
                  <label>Parameter end</label>
                  <input id="rot-max" type="number" defaultValue={6.283185307179586} step={0.5} />
                </div>
              </div>
              <div className="row">
                <div>
                  <label>Axis constant c</label>
                  <input id="rot-axis" type="number" defaultValue={3} step={0.5} />
                </div>
                <div>
                  <label>Color scale</label>
                  <select id="rot-scale" defaultValue="Viridis">
                    <option>Viridis</option>
                    <option>Cividis</option>
                    <option>Inferno</option>
                    <option>Magma</option>
                    <option>Jet</option>
                    <option>Rainbow</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div>
                  <label>Curve samples</label>
                  <input id="rot-steps" type="number" defaultValue={160} min={10} max={1000} />
                </div>
                <div>
                  <label>Angle samples</label>
                  <input id="rot-theta-steps" type="number" defaultValue={120} min={16} max={720} />
                </div>
              </div>
              <label htmlFor="rot-phi">Rotation angle</label>
              <div className="inline">
                <input id="rot-phi" type="range" min="0" max="360" defaultValue="360" />
                <span id="rot-phi-label">2π rad</span>
                <span style={{ marginLeft: 'auto' }} className="inline">
                  <input id="rot-auto" type="checkbox" />
                  <label htmlFor="rot-auto" style={{ margin: '0 6px 0 4px' }}>
                    Auto 0 → 2π
                  </label>
                  <input id="rot-speed" type="number" defaultValue={90} min={10} max={720} style={{ width: 90 }} />
                  <span className="note">deg/s</span>
                </span>
              </div>
              <div className="btns">
                <button id="rot-plot">Plot rotation</button>
                <button id="rot-reset">Reset View</button>
                <button id="rot-export" className="secondary">Export PNG</button>
              </div>

              <details className="diag">
                <summary>Diagnostics &amp; tests</summary>
                <div id="diag" className="mono" />
                <div className="btns">
                  <button id="runTests" className="ghost">Run tests</button>
                </div>
              </details>
            </section>
          </div>
        </aside>

        <main className="panel">
          <div id="plot" className="plot" />
          <footer>Pan = right‑drag • Rotate = left‑drag • Scroll = zoom</footer>
        </main>
      </div>

      {/* original styles ported as global so class names work 1:1 */}
      <style jsx global>{`
        :root{--bg:#0b0f14;--panel:#111823;--text:#e6eefb;--sub:#9fb1c7}
        *{box-sizing:border-box}
        body{margin:0;background:linear-gradient(120deg,var(--bg),#0a1220 40%,#070d15);color:var(--text);font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,"Helvetica Neue",Arial}
        header{padding:16px 20px;border-bottom:1px solid #0f1826;background:rgba(10,16,25,.7);backdrop-filter:saturate(140%) blur(8px);position:sticky;top:0;z-index:5}
        .wrap{display:grid;grid-template-columns:360px 1fr;gap:16px;padding:16px}
        @media (max-width: 1024px){.wrap{grid-template-columns:1fr}}
        .panel{background:linear-gradient(180deg,#111823,#0e1724 40%,#0c1522);border:1px solid #0f1a2a;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
        .controls{padding:16px}
        .tabs{display:flex;gap:8px;margin:8px 0 12px}
        .tab{padding:8px 12px;border-radius:10px;border:1px solid #20304a;color:#cfe0ff;background:linear-gradient(180deg,#0d1726,#0a1320);cursor:pointer}
        .tab.active{outline:2px solid #3966b3}
        .section{display:none}
        .section.active{display:block}
        label{display:block;font-size:12px;color:#c4d6f3;margin:10px 0 6px}
        input[type="number"], input[type="text"], select, textarea{width:100%;padding:10px 12px;border-radius:10px;border:1px solid #20304a;background:linear-gradient(180deg,#0c1522,#0a1220);color:#e6eefb}
        input[type="range"]{width:100%}
        textarea{min-height:84px;resize:vertical}
        .row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .inline{display:flex;align-items:center;gap:8px}
        .btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
        button{appearance:none;border:none;border-radius:12px;padding:10px 14px;font-weight:600;color:#06101f;background:linear-gradient(180deg,#89b6ff,#6aa1ff);cursor:pointer}
        button.secondary{background:linear-gradient(180deg,#b7ffe9,#7bffdb)}
        .plot{height:calc(100vh - 160px);min-height:520px;border-radius:16px}
        .status{padding:10px 12px;margin:12px 0;border-radius:12px;background:#0c1522;border:1px solid #20304a;color:#cfe0ff;font-size:12px}
        .note{color:#9fb1c7;font-size:12px;margin-top:8px}
        .mono{font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
        .pretty{min-height:28px;border:1px dashed #20304a;border-radius:8px;padding:6px 8px;color:#cfe0ff;background:linear-gradient(180deg,#0d1726,#0a1320);margin-top:6px}
        .pretty .katex{font-size:1.05rem}
      `}</style>
    </>
  )
}
