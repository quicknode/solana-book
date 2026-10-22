// A stepper for animated account figures. A scene file supplies the layout
// (hand-placed, on a 16:9 canvas) and an ordered list of steps; this file
// draws the scene in the book's figure vocabulary (DIAGRAMS.md in the
// companion plugin), in the colours of the Quicknode Solana Finance slides,
// and animates each step.
//
// Every step's end state is computed by replaying the actions without motion,
// so going back, jumping, or interrupting an animation always lands on the
// same picture the forward animation ends on.
//
// Classic script rather than a module, so index.html opens straight from disk.

(function () {
  // The slides' palette: near-black paper, accounts as pastel cards with dark
  // text, one bright green for what the step does. Each account kind keeps
  // one fill, so the kind reads from the colour as well as the icon.
  const THEME = {
    paper: "#040406",
    ink: "#f4f4f4",
    caption: "#b9bdc2",
    seed: "#8a8f94",
    curve: "#4f8a3c",
    boxText: "#161616",
    boxMuted: "#5d5d66",
    boxRule: "#c4c4cc",
    // Green on the dark paper, for arrows, coins and the headline's keyword.
    accent: "#95fc86",
    // Green dark enough to read on a pastel card, for changes inside one.
    accentInk: "#1f7a2a",
    fill: {
      wallet: "#f4f4f4",
      token: "#d9fbda",
      program: "#efeafe",
      struct: "#e9eaee",
      mint: "#f4f9e3",
    },
  };
  // On the dark paper a faded card reads as the slides' dark grey slab.
  const FADE = 0.22;
  const MONO = "'Andale Mono', 'DejaVu Sans Mono', Menlo, monospace";
  const SVG_NS = "http://www.w3.org/2000/svg";

  // The five account glyphs, verbatim from the book's figures with the ink
  // swapped for the theme's: each fills the 14-unit glyph box once placed.
  const ICONS = Object.fromEntries(
    Object.entries({
      struct: `<g transform="translate(-0.195,-0.195) scale(0.6)" fill="none" stroke="#111" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.843"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm0 5h18M10 3v18"/></g>`,
      token: `<g transform="translate(-0.624,-0.624) scale(0.6353)" fill="none" stroke="#111" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.047"><path d="M14.5 5.5h-4A6.5 6.5 0 0 0 7 17.478l.288 1.738c.07.423.105.635.202.798a1 1 0 0 0 .49.416c.178.07.392.07.822.07c.397 0 .596 0 .764-.062a1 1 0 0 0 .479-.374c.1-.148.15-.34.246-.727l.209-.837h3l.21.837c.096.386.144.58.245.727a1 1 0 0 0 .479.374c.168.062.367.062.764.062c.43 0 .644 0 .821-.07a1 1 0 0 0 .49-.416c.098-.163.133-.375.203-.798L17 17.478a6.5 6.5 0 0 0 2.502-2.978l.89-.178c.77-.154 1.155-.231 1.381-.508c.227-.276.227-.669.227-1.453v-.3c0-.75 0-1.124-.212-1.396c-.212-.27-.575-.362-1.303-.544L20 10c0-1.5-1.167-2.833-2-3.5v-3h-.264c-1.37 0-2.623.774-3.236 2"/><path d="M15.875 9.75h-.125m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0M2 8v2a2 2 0 0 0 2 2"/></g>`,
      wallet: `<g transform="translate(0.36,0.767) scale(0.8301)" fill="#111"><path d="M10.561 8.073a6 6 0 0 1 3.432 5.142a.75.75 0 1 1-1.498.07a4.5 4.5 0 0 0-8.99 0a.75.75 0 0 1-1.498-.07a6 6 0 0 1 3.431-5.142a3.999 3.999 0 1 1 5.123 0M10.5 5a2.5 2.5 0 1 0-5 0a2.5 2.5 0 0 0 5 0"/></g>`,
      mint: `<g transform="translate(0.52,0.519) scale(0.54)" fill="#111"><path d="m21.49 7.13l-9-5a.99.99 0 0 0-.97 0l-9.01 5C2.19 7.31 2 7.64 2 8v3c0 .55.45 1 1 1h2v4H3c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1h-2v-4h2c.55 0 1-.45 1-1V8a1 1 0 0 0-.51-.87M7 12h2v4H7zm6 0v4h-2v-4zm7 6v2H4v-2zm-3-2h-2v-4h2zm3-6H4V8.59l8-4.44l8 4.44z"/><path d="M12 6a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3"/></g>`,
      program: `<g transform="translate(0.951,0.952) scale(0.864)" fill="none" stroke="#111" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.28"><path d="M11.808 7.727c0 .05.017.1.048.14l.667.84a.96.96 0 0 1 .082 1.08l-.392.676a.96.96 0 0 1-.975.47l-1.063-.16a.23.23 0 0 0-.145.027l-1.26.727a.23.23 0 0 0-.096.112l-.392 1a.96.96 0 0 1-.893.611h-.782a.96.96 0 0 1-.893-.61l-.392-1a.23.23 0 0 0-.096-.113L3.967 10.8a.23.23 0 0 0-.145-.028l-1.063.162a.96.96 0 0 1-.976-.47l-.39-.677a.96.96 0 0 1 .08-1.08l.67-.84a.22.22 0 0 0 .05-.14V6.273c0-.05-.018-.1-.05-.14l-.67-.84a.96.96 0 0 1-.08-1.08l.39-.676a.96.96 0 0 1 .976-.47l1.06.16a.23.23 0 0 0 .145-.027l1.262-.73a.23.23 0 0 0 .096-.113l.394-.996A.96.96 0 0 1 6.61.75h.784a.96.96 0 0 1 .893.61l.392.997q.028.075.096.116l1.26.727a.23.23 0 0 0 .145.028l1.062-.162a.96.96 0 0 1 .976.47l.391.677a.96.96 0 0 1-.081 1.08l-.67.84a.22.22 0 0 0-.049.14v1.454Z"/><path d="M7 8.996c1.277 0 1.996-.719 1.996-1.996S8.277 5.004 7 5.004S5.004 5.723 5.004 7S5.723 8.996 7 8.996"/></g>`,
    }).map(([kind, svg]) => [kind, svg.replaceAll("#111", THEME.boxText)]),
  );

  // Three rings with a halo in the paper colour, so the mark occludes any
  // stroke beneath it.
  const COIN = `<g fill="${THEME.paper}"><g stroke="${THEME.paper}" stroke-width="4.5"><circle cx="5" cy="1.5" r="4.5"/><circle cx="0" cy="0" r="4.5"/><circle cx="-5" cy="1.5" r="4.5"/></g><g stroke="${THEME.accent}" stroke-width="1.3"><circle cx="5" cy="1.5" r="4.5"/><circle cx="0" cy="0" r="4.5"/><circle cx="-5" cy="1.5" r="4.5"/></g></g>`;

  const HALO = `stroke="${THEME.paper}" stroke-width="4" paint-order="stroke" stroke-linejoin="round"`;

  const escape = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (t) => Math.max(0, Math.min(1, t));

  // The cluster curve: flat at the top left, sloping down to the right, as
  // one quadratic across the whole canvas. yAt() puts an address dot on it.
  function clusterCurve(width, { top = 33, drop = 80, control = 0.625 } = {}) {
    const cx = width * control;
    const d = `M 0,${top} Q ${cx},${top} ${width},${top + drop}`;
    // x(t) = 2(1-t)t·cx + t²·width, solved for t; y follows from t.
    const yAt = (x) => {
      const a = width - 2 * cx;
      const b = 2 * cx;
      const t = Math.abs(a) < 1e-9 ? x / b : (-b + Math.sqrt(b * b + 4 * a * x)) / (2 * a);
      return top + drop * t * t;
    };
    return { d, yAt };
  }

  // ---- State ---------------------------------------------------------------

  function initialState() {
    return { exists: [], focus: [], isNew: [], titles: {}, lines: {}, handlers: [], arrows: [] };
  }

  function lineIndex(lines, key) {
    if (key == null) return 0;
    return lines.findIndex((l) => l.text.startsWith(key + ": "));
  }

  function lineText(key, value) {
    return key == null ? value : `${key}: ${value}`;
  }

  // Applies one action to a state, with no motion. The animator plays the
  // same actions and then lands on the state this produces.
  function reduce(state, action) {
    const s = structuredClone(state);
    switch (action.type) {
      case "show":
        for (const id of action.ids) if (!s.exists.includes(id)) s.exists.push(id);
        for (const [id, lines] of Object.entries(action.lines || {})) s.lines[id] = lines;
        // focus: "all" draws everything in full, "shown" adds the arriving
        // accounts to what is already in full, and a list replaces it.
        if (action.focus === "all") s.focus = [...s.exists];
        else if (action.focus === "shown") s.focus = [...new Set([...s.focus, ...action.ids])];
        else if (action.focus) s.focus = [...action.focus];
        break;
      case "focus":
        s.focus = action.ids === "all" ? [...s.exists] : [...action.ids];
        break;
      // A call lights its handler, and with `also` the handlers it calls in
      // other programs; a call with no handler is a step no program takes,
      // such as the market moving.
      case "call":
        s.handlers = [action.handler, ...(action.also || [])].filter(Boolean);
        s.arrows = [];
        s.isNew = [];
        s.focus = [...action.focus];
        break;
      case "create":
        if (!s.exists.includes(action.id)) s.exists.push(action.id);
        if (!s.focus.includes(action.id)) s.focus.push(action.id);
        s.isNew.push(action.id);
        s.lines[action.id] = action.lines;
        break;
      case "set":
        for (const change of action.changes) {
          if (change.title) s.titles[change.id] = change.title;
          if (change.value != null) {
            const lines = s.lines[change.id];
            lines[lineIndex(lines, change.key)].text = lineText(change.key, change.value);
          }
        }
        break;
      case "hide":
        s.arrows = [];
        s.exists = s.exists.filter((id) => !action.ids.includes(id));
        s.focus = s.focus.filter((id) => !action.ids.includes(id));
        break;
      case "close":
        s.exists = s.exists.filter((id) => id !== action.id);
        s.focus = s.focus.filter((id) => id !== action.id);
        s.isNew = s.isNew.filter((id) => id !== action.id);
        break;
      // Within a call, a lit handler can change, as when a deposit moves from
      // buying one asset through the router to buying the next.
      case "highlight":
        s.handlers = [...action.handlers];
        break;
      // An `alone` transfer replaces the step's earlier arrows rather than
      // adding to them, for a handler that makes many transfers in a row. A
      // side without a `value` is an account with no balance to show, such as
      // a program that trades on the far side.
      case "transfer":
        if (action.alone) s.arrows = [];
        s.arrows.push(action.arrow);
        for (const change of [action.from, action.to]) {
          if (change.value == null) continue;
          const lines = s.lines[change.id];
          lines[lineIndex(lines, change.key)].text = lineText(change.key, change.value);
        }
        break;
      default:
        throw new Error(`unknown action ${action.type}`);
    }
    return s;
  }

  // ---- Drawing -------------------------------------------------------------

  // An account's expanded height is the book's anatomy: a 21-unit title bar,
  // 12 units a line (10 for handler lists), and the bottom padding.
  function expandedHeight(acc, lineCount) {
    if (lineCount === 0) return 22;
    return acc.kind === "program" ? 21 + lineCount * 10 + 9 : 21 + lineCount * 12 + 7;
  }

  function lineAttrs(acc, line, state) {
    if (acc.kind === "program") {
      const active = state.handlers.includes(line.text);
      return `font-size="8.5" font-family="${MONO}" ${active ? `font-weight="bold" fill="${THEME.accentInk}"` : `fill="${THEME.boxMuted}"`}`;
    }
    switch (line.style) {
      case "sol": return `font-size="9.5" fill="${THEME.boxMuted}"`;
      case "balance": return `font-size="9" fill="${THEME.boxText}"`;
      case "note": return `font-size="9" font-style="italic" fill="${THEME.boxMuted}"`;
      default: return `font-size="9.5" fill="${THEME.boxText}"`;
    }
  }

  function accountMarkup(acc, state) {
    const lines = state.lines[acc.id] || [];
    const title = state.titles[acc.id] || acc.title;
    const r = acc.onCurve ? 5 : 4.5;
    const step = acc.kind === "program" ? 10 : 12;
    let out = `<g class="acc" data-id="${acc.id}">`;
    // The opaque disc keeps a faded dot from letting the curve show through.
    out += `<circle class="backing" cx="${acc.dot.cx}" cy="${acc.dot.cy}" r="${r + 1}" fill="${THEME.paper}"/>`;
    out += `<g class="body">`;
    out += `<circle cx="${acc.dot.cx}" cy="${acc.dot.cy}" r="${r}" fill="${THEME.ink}"/>`;
    (acc.seeds?.lines || []).forEach((seed, i) => {
      out += `<text x="${acc.seeds.x}" y="${acc.seeds.y + i * 9}" font-size="7" font-family="${MONO}" fill="${THEME.seed}">${escape(seed)}</text>`;
    });
    out += `<rect class="box" x="${acc.x}" y="${acc.y}" width="${acc.w}" height="22" rx="3" fill="${THEME.fill[acc.kind]}"/>`;
    out += `<g class="icon" transform="translate(${acc.x + 8},${acc.y + 4})">${ICONS[acc.kind]}</g>`;
    out += `<text class="title" x="${acc.x + 28}" y="${acc.y + 14.5}" font-size="10.5" font-weight="bold" fill="${THEME.boxText}">${escape(title)}</text>`;
    out += `<line class="rule" x1="${acc.x + 8}" y1="${acc.y + 21}" x2="${acc.x + acc.w - 8}" y2="${acc.y + 21}" stroke="${THEME.boxRule}" stroke-width="0.8"/>`;
    out += `<g class="lines">`;
    lines.forEach((line, i) => {
      out += `<text data-line="${i}" x="${acc.x + 8}" y="${acc.y + 32 + i * step}" ${lineAttrs(acc, line, state)}>${escape(line.text)}</text>`;
    });
    out += `</g>`;
    out += `<text class="new" x="${acc.x + acc.w - 8}" y="${acc.y + 14.5}" font-size="8" font-family="${MONO}" letter-spacing="1" fill="${THEME.accentInk}" text-anchor="end">NEW</text>`;
    out += `<text class="closed" x="${acc.x + acc.w - 8}" y="${acc.y + 14.5}" font-size="8" font-family="${MONO}" letter-spacing="1" fill="${THEME.boxText}" text-anchor="end" opacity="0">CLOSED</text>`;
    out += `</g></g>`;
    return out;
  }

  // Sets an account's drawn focus: 0 is faded to its heading, 1 is expanded
  // with its lines. appear scales the group's opacity, for a new account.
  function applyFocus(scene, g, t, appear = 1) {
    const acc = scene.accounts[g.dataset.id];
    const lineCount = g.querySelectorAll(".lines text").length;
    const e = lineCount > 0 ? t : 0;
    g.querySelector(".box").setAttribute("height", lerp(22, expandedHeight(acc, lineCount), e));
    g.querySelector(".icon").setAttribute("transform", `translate(${acc.x + 8},${acc.y + lerp(4, 3.5, e)})`);
    g.querySelector(".title").setAttribute("y", acc.y + lerp(14.5, 14.175, e));
    g.querySelector(".rule").setAttribute("opacity", lineCount > 0 ? clamp01((e - 0.6) / 0.4) : 0);
    g.querySelector(".lines").setAttribute("opacity", clamp01((e - 0.85) / 0.15));
    g.querySelector(".body").setAttribute("opacity", lerp(FADE, 1, t) * appear);
    g.querySelector(".backing").setAttribute("opacity", appear);
    g.dataset.t = t;
  }

  // An arrow names where its coin sits as a fraction of its length; the
  // label hangs off the coin, so both stay on the stroke if the path moves.
  function arrowMarkup(arrow, { partial = false } = {}) {
    let out = `<g class="arrow" data-id="${arrow.id}">`;
    out += `<path class="stroke" d="${arrow.d}" fill="none" stroke="${THEME.accent}" stroke-width="1.8" ${partial ? "" : `marker-end="url(#anim-arr)"`}/>`;
    out += `<g class="label">`;
    arrow.label.forEach((text, i) => {
      out += `<text ${HALO} x="${arrow.labelAt.dx}" y="${arrow.labelAt.dy + i * 13}" font-size="10.5" font-weight="bold" fill="${THEME.accent}" text-anchor="${arrow.labelAt.anchor || "start"}">${escape(text)}</text>`;
    });
    out += `</g><g class="coin">${COIN}</g></g>`;
    return out;
  }

  // Places an arrow's coin on its stroke and its label beside the coin. The
  // coin sits at `coinAt`, a fraction of the stroke's length, or at the point
  // of the stroke nearest `coinNear`, for a routed arrow whose straight runs
  // are easier to name by place than by length.
  function placeArrow(g, arrow) {
    const path = g.querySelector(".stroke");
    const length = path.getTotalLength();
    let pt = path.getPointAtLength(length * (arrow.coinAt ?? 0.5));
    if (arrow.coinNear) {
      let best = Infinity;
      for (let i = 0; i <= 400; i++) {
        const q = path.getPointAtLength((length * i) / 400);
        const d = (q.x - arrow.coinNear.x) ** 2 + (q.y - arrow.coinNear.y) ** 2;
        if (d < best) { best = d; pt = q; }
      }
    }
    g.querySelector(".coin").setAttribute("transform", `translate(${pt.x},${pt.y})`);
    g.querySelector(".label").setAttribute("transform", `translate(${pt.x},${pt.y})`);
  }

  function sceneMarkup(scene, state, stepIndex) {
    const { width, height } = scene.canvas;
    const step = scene.steps[stepIndex];
    const c = scene.caption;
    let out = `<defs><marker id="anim-arr" markerWidth="9" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0,0 L9,4 L0,8 z" fill="${THEME.accent}"/></marker></defs>`;
    out += `<rect width="${width}" height="${height}" fill="${THEME.paper}"/>`;
    out += `<g class="scene"><path d="${scene.curve.d}" fill="none" stroke="${THEME.curve}" stroke-width="2"/>`;
    out += `<text ${HALO} x="${scene.network.x}" y="${scene.network.y}" font-size="10" font-family="${MONO}" letter-spacing="1" fill="${THEME.seed}" text-anchor="end">${escape(scene.network.text.toUpperCase())}</text>`;
    out += `<foreignObject x="16" y="12" width="120" height="16"><div xmlns="http://www.w3.org/1999/xhtml" class="step-tag" style="font: 8px ${MONO};letter-spacing:1px;color:${THEME.seed}">${escape(stepTag(stepIndex))}</div></foreignObject>`;
    out += `<foreignObject x="140" y="6" width="${width - 280}" height="40"><div xmlns="http://www.w3.org/1999/xhtml" class="headline" style="text-align:center;font-size:19px;line-height:28px;color:${THEME.ink}">${headlineHtml(step.title)}</div></foreignObject>`;
    out += `<foreignObject class="caption" x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${c.fontSize}px;line-height:1.45;color:${THEME.caption}">${escape(step.caption)}</div></foreignObject>`;
    out += `<g class="accounts">`;
    for (const id of scene.order) {
      if (state.exists.includes(id)) out += accountMarkup(scene.accounts[id], state);
    }
    out += `</g><g class="arrows">`;
    for (const arrow of state.arrows) out += arrowMarkup(arrow);
    out += `</g><g class="movers"></g></g>`;
    const progress = scene.steps.length > 1 ? stepIndex / (scene.steps.length - 1) : 1;
    out += `<rect class="progress" x="0" y="${height - 3}" width="${width * progress}" height="3" fill="${THEME.accent}"/>`;
    return out;
  }

  // A title marks its keyword in brackets, "Maria runs [collect_fees()]",
  // and the keyword is set on the slides' green highlight.
  function headlineHtml(title) {
    return escape(title).replace(
      /\[([^\]]+)\]/g,
      `<mark style="background:${THEME.accent};color:${THEME.boxText};padding:0 3px">$1</mark>`,
    );
  }

  function stepTag(i) {
    return `// STEP ${i + 1}`;
  }

  // ---- Motion --------------------------------------------------------------

  const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

  // Parses the one number in a line, so a balance can count from one value
  // to the next: "1,024.75 USDC" is 1024.75 with two decimals.
  function numberIn(text) {
    const m = text.match(/-?\d[\d,]*(?:\.\d+)?/);
    if (!m) return null;
    const value = Number(m[0].replace(/,/g, ""));
    const decimals = (m[0].split(".")[1] || "").length;
    return { value, decimals, before: text.slice(0, m.index), after: text.slice(m.index + m[0].length) };
  }

  function formatNumber(value, decimals) {
    return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  class Player {
    constructor(scene, svg, { onStep } = {}) {
      this.scene = scene;
      this.svg = svg;
      this.onStep = onStep || (() => {});
      this.skip = false;
      this.busy = null;
      this.speed = 1;
      this.autoplay = null;
      // states[i] is the picture once step i has finished. A step starts
      // from the one before it, or, with `from`, from the end of the step
      // carrying that key: how another future branches off the story, and how
      // the story resumes after it.
      this.states = [];
      this.bases = [];
      const keys = {};
      scene.steps.forEach((step, i) => {
        if (step.from != null && !(step.from in keys)) throw new Error(`step ${i + 1} starts from unknown key ${step.from}`);
        const base = i === 0 ? null : step.from != null ? keys[step.from] : i - 1;
        let s = base == null ? initialState() : this.states[base];
        for (const action of step.actions) s = reduce(s, action);
        this.states.push(s);
        this.bases.push(base);
        if (step.key != null) keys[step.key] = i;
      });
      this.index = 0;
      this.render(this.states[0], 0);
    }

    get count() {
      return this.scene.steps.length;
    }

    render(state, stepIndex) {
      this.svg.innerHTML = sceneMarkup(this.scene, state, stepIndex);
      for (const g of this.svg.querySelectorAll(".acc")) {
        applyFocus(this.scene, g, state.focus.includes(g.dataset.id) ? 1 : 0);
        g.querySelector(".new").setAttribute("opacity", state.isNew.includes(g.dataset.id) ? 1 : 0);
      }
      for (const g of this.svg.querySelectorAll(".arrows .arrow")) {
        placeArrow(g, state.arrows.find((a) => a.id === g.dataset.id));
      }
    }

    // Jumps to a step's end state, with no motion.
    async goto(i) {
      await this.interrupt();
      this.index = Math.max(0, Math.min(this.count - 1, i));
      this.render(this.states[this.index], this.index);
      this.onStep(this.index);
    }

    async next() {
      if (this.busy) return this.interrupt();
      if (this.index >= this.count - 1) return;
      this.index += 1;
      this.onStep(this.index);
      const run = this.play(this.index);
      this.busy = run;
      await run;
      if (this.busy === run) this.busy = null;
    }

    prev() {
      this.stopAutoplay();
      return this.goto(this.index - 1);
    }

    // Plays every remaining step, holding each finished one for `hold` ms.
    startAutoplay(hold = this.scene.hold || 3000) {
      this.stopAutoplay();
      const token = {};
      this.autoplay = token;
      const tick = async () => {
        if (this.autoplay !== token) return;
        if (this.index >= this.count - 1) return this.stopAutoplay();
        await this.next();
        if (this.autoplay === token) token.timer = setTimeout(tick, hold);
      };
      token.timer = setTimeout(tick, hold);
    }

    stopAutoplay() {
      if (this.autoplay) clearTimeout(this.autoplay.timer);
      this.autoplay = null;
    }

    // Finishes the running animation at once, on its end state.
    async interrupt() {
      if (!this.busy) return;
      this.skip = true;
      await this.busy;
      this.skip = false;
      this.busy = null;
    }

    tween(ms, fn) {
      return new Promise((resolve) => {
        if (this.skip || ms <= 0) { fn(1); return resolve(); }
        const start = performance.now();
        const frame = (now) => {
          const p = this.skip ? 1 : Math.min(1, (now - start) / (ms / this.speed));
          fn(easeInOut(p));
          if (p < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
    }

    wait(ms) {
      return this.tween(ms, () => {});
    }

    async play(i) {
      const base = this.bases[i];
      let state = this.states[base];
      if (base !== i - 1) {
        // A jump between futures: fade to the state this step starts from.
        await this.tween(300, (p) => this.svg.querySelector(".scene").setAttribute("opacity", 1 - p));
        this.render(state, i - 1);
        this.svg.querySelector(".scene").setAttribute("opacity", 0);
        await this.tween(300, (p) => this.svg.querySelector(".scene").setAttribute("opacity", p));
      } else {
        this.render(state, i - 1);
      }
      await this.retitle(i);
      for (const action of this.scene.steps[i].actions) {
        await this.animate(state, action);
        state = reduce(state, action);
      }
      // Land exactly on the computed end state, whatever the motion left.
      this.render(this.states[i], i);
    }

    // Swaps in the step's headline and caption, and moves the progress bar.
    async retitle(i) {
      const step = this.scene.steps[i];
      const headline = this.svg.querySelector(".headline");
      const tag = this.svg.querySelector(".step-tag");
      const caption = this.svg.querySelector(".caption div");
      const bar = this.svg.querySelector(".progress");
      const from = Number(bar.getAttribute("width"));
      const to = (this.scene.canvas.width * i) / (this.count - 1);
      await this.tween(250, (p) => {
        headline.style.opacity = 1 - p;
        caption.style.opacity = 1 - p;
      });
      headline.innerHTML = headlineHtml(step.title);
      tag.textContent = stepTag(i);
      caption.textContent = step.caption;
      await this.tween(300, (p) => {
        headline.style.opacity = p;
        caption.style.opacity = p;
        bar.setAttribute("width", lerp(from, to, p));
      });
    }

    // Lights the named handler lines in every program box, and dims the rest.
    lightHandlers(handlers) {
      for (const g of this.svg.querySelectorAll(".acc")) {
        if (this.scene.accounts[g.dataset.id].kind !== "program") continue;
        for (const t of g.querySelectorAll(".lines text")) {
          const active = handlers.includes(t.textContent);
          t.setAttribute("fill", active ? THEME.accentInk : THEME.boxMuted);
          t.setAttribute("font-weight", active ? "bold" : "normal");
        }
      }
    }

    accountGroup(id) {
      return this.svg.querySelector(`.acc[data-id="${id}"]`);
    }

    // Moves every account from its focus in one state to its focus in the next.
    refocus(to) {
      const groups = [...this.svg.querySelectorAll(".acc")];
      const starts = groups.map((g) => Number(g.dataset.t));
      const ends = groups.map((g) => (to.focus.includes(g.dataset.id) ? 1 : 0));
      return this.tween(700, (p) => groups.forEach((g, k) => applyFocus(this.scene, g, lerp(starts[k], ends[k], p))));
    }

    // Counts a line from its old value to its new one, tinted with the accent
    // while it changes, then settles back to the ink.
    async changeLine(id, key, value) {
      const g = this.accountGroup(id);
      const lines = [...g.querySelectorAll(".lines text")];
      const el = lines.find((t) => (key == null ? t.dataset.line === "0" : t.textContent.startsWith(key + ": ")));
      const fromText = el.textContent;
      const toText = lineText(key, value);
      const a = numberIn(fromText);
      const b = numberIn(toText);
      el.style.transition = "fill 0.3s";
      el.style.fill = THEME.accentInk;
      if (a && b && a.before === b.before && a.after === b.after) {
        const decimals = Math.max(a.decimals, b.decimals);
        await this.tween(900, (p) => {
          el.textContent = p >= 1 ? toText : a.before + formatNumber(lerp(a.value, b.value, p), decimals) + a.after;
        });
      } else {
        await this.tween(250, (p) => el.setAttribute("opacity", 1 - p));
        el.textContent = toText;
        await this.tween(250, (p) => el.setAttribute("opacity", p));
      }
      setTimeout(() => (el.style.fill = ""), this.skip ? 0 : 700 / this.speed);
    }

    async animate(state, action) {
      const next = reduce(state, action);
      switch (action.type) {
        case "show":
        case "focus": {
          // Accounts already on screen move to their new focus; ones arriving
          // fade in where they stand.
          const starts = Object.fromEntries([...this.svg.querySelectorAll(".acc")].map((g) => [g.dataset.id, Number(g.dataset.t)]));
          this.svg.querySelector(".accounts").innerHTML = this.scene.order
            .filter((id) => next.exists.includes(id))
            .map((id) => accountMarkup(this.scene.accounts[id], next))
            .join("");
          const groups = [...this.svg.querySelectorAll(".acc")];
          const end = (g) => (next.focus.includes(g.dataset.id) ? 1 : 0);
          await this.tween(700, (p) =>
            groups.forEach((g) => {
              const id = g.dataset.id;
              if (id in starts) applyFocus(this.scene, g, lerp(starts[id], end(g), p));
              else applyFocus(this.scene, g, end(g), p);
            }),
          );
          return;
        }
        case "call": {
          const old = [...this.svg.querySelectorAll(".arrows .arrow, .acc .new")];
          await this.tween(300, (p) => old.forEach((el) => el.setAttribute("opacity", 1 - p)));
          for (const el of this.svg.querySelectorAll(".arrows .arrow")) el.remove();
          this.lightHandlers(next.handlers);
          await this.refocus(next);
          return this.wait(200);
        }
        case "highlight":
          this.lightHandlers(next.handlers);
          return this.wait(200);
        case "create": {
          const holder = document.createElementNS(SVG_NS, "g");
          holder.innerHTML = accountMarkup(this.scene.accounts[action.id], next);
          const g = holder.firstElementChild;
          // Keep the scene's drawing order, so a box never lands on top of a later one.
          const layer = this.svg.querySelector(".accounts");
          const order = this.scene.order;
          const after = [...layer.children].find((el) => order.indexOf(el.dataset.id) > order.indexOf(action.id));
          layer.insertBefore(g, after || null);
          const badge = g.querySelector(".new");
          badge.setAttribute("opacity", 0);
          applyFocus(this.scene, g, 0, 0);
          await this.tween(350, (p) => applyFocus(this.scene, g, 0, p));
          await this.tween(600, (p) => applyFocus(this.scene, g, p, 1));
          await this.tween(250, (p) => badge.setAttribute("opacity", p));
          return this.wait(250);
        }
        case "set": {
          await Promise.all(
            action.changes.map(async (change) => {
              if (change.title) {
                const el = this.accountGroup(change.id).querySelector(".title");
                await this.tween(250, (p) => el.setAttribute("opacity", 1 - p));
                el.textContent = change.title;
                await this.tween(250, (p) => el.setAttribute("opacity", p));
              }
              if (change.value != null) await this.changeLine(change.id, change.key, change.value);
            }),
          );
          return this.wait(300);
        }
        case "hide": {
          const groups = [...action.ids.map((id) => this.accountGroup(id)).filter(Boolean), ...this.svg.querySelectorAll(".arrows .arrow")];
          await this.tween(500, (p) => groups.forEach((g) => g.setAttribute("opacity", 1 - p)));
          groups.forEach((g) => g.remove());
          return;
        }
        case "close": {
          const g = this.accountGroup(action.id);
          g.querySelector(".new").setAttribute("opacity", 0);
          const badge = g.querySelector(".closed");
          await this.tween(250, (p) => badge.setAttribute("opacity", p));
          await this.wait(700);
          await this.tween(600, (p) => g.setAttribute("opacity", 1 - p));
          g.remove();
          return this.wait(200);
        }
        case "transfer": {
          if (action.alone) {
            const old = [...this.svg.querySelectorAll(".arrows .arrow")];
            await this.tween(250, (p) => old.forEach((el) => el.setAttribute("opacity", 1 - p)));
            old.forEach((el) => el.remove());
          }
          const layer = this.svg.querySelector(".arrows");
          layer.insertAdjacentHTML("beforeend", arrowMarkup(action.arrow, { partial: true }));
          const g = layer.lastElementChild;
          placeArrow(g, action.arrow);
          const path = g.querySelector(".stroke");
          const marks = [g.querySelector(".label"), g.querySelector(".coin")];
          marks.forEach((el) => el.setAttribute("opacity", 0));
          const length = path.getTotalLength();
          path.setAttribute("stroke-dasharray", `${length} ${length}`);
          await this.tween(600, (p) => path.setAttribute("stroke-dashoffset", length * (1 - p)));
          path.removeAttribute("stroke-dasharray");
          path.removeAttribute("stroke-dashoffset");
          path.setAttribute("marker-end", "url(#anim-arr)");
          // The tokens leave the source as a coin sets off along the arrow,
          // and arrive in the destination as it lands.
          const mover = document.createElementNS(SVG_NS, "g");
          mover.innerHTML = COIN;
          this.svg.querySelector(".movers").appendChild(mover);
          const leaving = action.from.value == null ? null : this.changeLine(action.from.id, action.from.key, action.from.value);
          await this.tween(1300, (p) => {
            const pt = path.getPointAtLength(length * p);
            mover.setAttribute("transform", `translate(${pt.x},${pt.y})`);
          });
          mover.remove();
          await Promise.all([leaving, action.to.value == null ? null : this.changeLine(action.to.id, action.to.key, action.to.value)]);
          await this.tween(300, (p) => marks.forEach((el) => el.setAttribute("opacity", p)));
          return this.wait(200);
        }
        default:
          throw new Error(`unknown action ${action.type}`);
      }
    }
  }

  // A path through waypoints, straight between them and turning each corner
  // on a quarter curve of radius r, so the stroke stays smooth at every join.
  function rounded(points, r = 8) {
    let d = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 1; i < points.length - 1; i++) {
      const [px, py] = points[i - 1], [x, y] = points[i], [nx, ny] = points[i + 1];
      const into = Math.hypot(x - px, y - py), out = Math.hypot(nx - x, ny - y);
      const k = Math.min(r, into / 2, out / 2);
      d += ` L ${x - ((x - px) / into) * k},${y - ((y - py) / into) * k}`;
      d += ` Q ${x},${y} ${x + ((nx - x) / out) * k},${y + ((ny - y) / out) * k}`;
    }
    const [lx, ly] = points[points.length - 1];
    return `${d} L ${lx},${ly}`;
  }

  window.AccountAnimation = { Player, reduce, clusterCurve, rounded, THEME, ICONS };
})();
