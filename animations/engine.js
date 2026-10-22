// A stepper for animated account figures. A scene file supplies the layout
// (hand-placed, in the book figure's own coordinates) and an ordered list of
// steps; this file draws the scene in the book's figure vocabulary
// (DIAGRAMS.md in the companion plugin) and animates each step's actions.
//
// Every step's end state is computed by replaying the actions without motion,
// so going back, jumping, or interrupting an animation always lands on the
// same picture the forward animation ends on.
//
// Classic script rather than a module, so index.html opens straight from disk.

(function () {
  const INK = "#111";
  const ACCENT = "#1e7a3c";
  const FADE = 0.3;
  const SANS = "'Denim INK', Helvetica, Arial, sans-serif";
  const MONO = "'DejaVu Sans Mono', Menlo, monospace";
  const SVG_NS = "http://www.w3.org/2000/svg";

  // The five account glyphs, verbatim from the book's figures: each fills the
  // 14-unit glyph box once placed with translate(x, y).
  const ICONS = {
    struct: `<g transform="translate(-0.195,-0.195) scale(0.6)" fill="none" stroke="#111" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.843"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm0 5h18M10 3v18"/></g>`,
    token: `<g transform="translate(-0.624,-0.624) scale(0.6353)" fill="none" stroke="#111" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.047"><path d="M14.5 5.5h-4A6.5 6.5 0 0 0 7 17.478l.288 1.738c.07.423.105.635.202.798a1 1 0 0 0 .49.416c.178.07.392.07.822.07c.397 0 .596 0 .764-.062a1 1 0 0 0 .479-.374c.1-.148.15-.34.246-.727l.209-.837h3l.21.837c.096.386.144.58.245.727a1 1 0 0 0 .479.374c.168.062.367.062.764.062c.43 0 .644 0 .821-.07a1 1 0 0 0 .49-.416c.098-.163.133-.375.203-.798L17 17.478a6.5 6.5 0 0 0 2.502-2.978l.89-.178c.77-.154 1.155-.231 1.381-.508c.227-.276.227-.669.227-1.453v-.3c0-.75 0-1.124-.212-1.396c-.212-.27-.575-.362-1.303-.544L20 10c0-1.5-1.167-2.833-2-3.5v-3h-.264c-1.37 0-2.623.774-3.236 2"/><path d="M15.875 9.75h-.125m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0M2 8v2a2 2 0 0 0 2 2"/></g>`,
    wallet: `<g transform="translate(0.36,0.767) scale(0.8301)" fill="#111"><path d="M10.561 8.073a6 6 0 0 1 3.432 5.142a.75.75 0 1 1-1.498.07a4.5 4.5 0 0 0-8.99 0a.75.75 0 0 1-1.498-.07a6 6 0 0 1 3.431-5.142a3.999 3.999 0 1 1 5.123 0M10.5 5a2.5 2.5 0 1 0-5 0a2.5 2.5 0 0 0 5 0"/></g>`,
    mint: `<g transform="translate(0.52,0.519) scale(0.54)" fill="#111"><path d="m21.49 7.13l-9-5a.99.99 0 0 0-.97 0l-9.01 5C2.19 7.31 2 7.64 2 8v3c0 .55.45 1 1 1h2v4H3c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1h-2v-4h2c.55 0 1-.45 1-1V8a1 1 0 0 0-.51-.87M7 12h2v4H7zm6 0v4h-2v-4zm7 6v2H4v-2zm-3-2h-2v-4h2zm3-6H4V8.59l8-4.44l8 4.44z"/><path d="M12 6a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3"/></g>`,
    program: `<g transform="translate(0.951,0.952) scale(0.864)" fill="none" stroke="#111" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.28"><path d="M11.808 7.727c0 .05.017.1.048.14l.667.84a.96.96 0 0 1 .082 1.08l-.392.676a.96.96 0 0 1-.975.47l-1.063-.16a.23.23 0 0 0-.145.027l-1.26.727a.23.23 0 0 0-.096.112l-.392 1a.96.96 0 0 1-.893.611h-.782a.96.96 0 0 1-.893-.61l-.392-1a.23.23 0 0 0-.096-.113L3.967 10.8a.23.23 0 0 0-.145-.028l-1.063.162a.96.96 0 0 1-.976-.47l-.39-.677a.96.96 0 0 1 .08-1.08l.67-.84a.22.22 0 0 0 .05-.14V6.273c0-.05-.018-.1-.05-.14l-.67-.84a.96.96 0 0 1-.08-1.08l.39-.676a.96.96 0 0 1 .976-.47l1.06.16a.23.23 0 0 0 .145-.027l1.262-.73a.23.23 0 0 0 .096-.113l.394-.996A.96.96 0 0 1 6.61.75h.784a.96.96 0 0 1 .893.61l.392.997q.028.075.096.116l1.26.727a.23.23 0 0 0 .145.028l1.062-.162a.96.96 0 0 1 .976.47l.391.677a.96.96 0 0 1-.081 1.08l-.67.84a.22.22 0 0 0-.049.14v1.454Z"/><path d="M7 8.996c1.277 0 1.996-.719 1.996-1.996S8.277 5.004 7 5.004S5.004 5.723 5.004 7S5.723 8.996 7 8.996"/></g>`,
  };

  const COIN = `<g stroke="#fff" stroke-width="4.5"><circle cx="5" cy="1.5" r="4.5"/><circle cx="0" cy="0" r="4.5"/><circle cx="-5" cy="1.5" r="4.5"/></g><g stroke="${ACCENT}" stroke-width="1.3"><circle cx="5" cy="1.5" r="4.5"/><circle cx="0" cy="0" r="4.5"/><circle cx="-5" cy="1.5" r="4.5"/></g>`;

  const HALO = `stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round"`;

  const escape = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (t) => Math.max(0, Math.min(1, t));

  // ---- State ---------------------------------------------------------------

  // A state is plain data: which accounts exist, which are in focus, every
  // account's lines, the active handler and the step's arrows.
  function initialState(scene) {
    return {
      headline: "",
      exists: [],
      focus: [],
      isNew: [],
      titles: {},
      lines: {},
      handler: null,
      arrows: [],
    };
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
  function reduce(scene, state, action) {
    const s = structuredClone(state);
    switch (action.type) {
      case "headline":
        s.headline = action.text;
        break;
      case "show":
        for (const id of action.ids) if (!s.exists.includes(id)) s.exists.push(id);
        for (const [id, lines] of Object.entries(action.lines || {})) s.lines[id] = lines;
        break;
      case "focus":
        s.focus = action.ids === "all" ? [...s.exists] : [...action.ids];
        break;
      case "call":
        s.handler = action.handler;
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
      case "transfer": {
        s.arrows.push(action.arrow);
        for (const change of [action.from, action.to]) {
          const lines = s.lines[change.id];
          lines[lineIndex(lines, change.key)].text = lineText(change.key, change.value);
        }
        break;
      }
      default:
        throw new Error(`unknown action ${action.type}`);
    }
    return s;
  }

  // ---- Drawing -------------------------------------------------------------

  // An account box's geometry at focus t: 0 is faded to its heading, 1 is
  // expanded with its lines. Expanded height is the book's anatomy: a 21-unit
  // title bar, 12 units a line (10 for handler lists), and the bottom padding.
  function expandedHeight(acc, lines) {
    if (!lines || lines.length === 0) return 22;
    return acc.kind === "program" ? 21 + lines.length * 10 + 9 : 21 + lines.length * 12 + 7;
  }

  function lineAttrs(acc, line, state) {
    if (acc.kind === "program") {
      const active = line.text === state.handler;
      return `font-size="8.5" font-family="${MONO}" ${active ? `font-weight="bold" fill="${ACCENT}"` : `fill="#888"`}`;
    }
    switch (line.style) {
      case "sol": return `font-size="9.5" fill="#444"`;
      case "balance": return `font-size="9"`;
      case "note": return `font-size="9" font-style="italic" fill="#444"`;
      default: return `font-size="9.5"`;
    }
  }

  function accountMarkup(scene, acc, state) {
    const lines = state.lines[acc.id] || [];
    const title = state.titles[acc.id] || acc.title;
    const struct = acc.kind === "struct";
    const r = acc.onCurve ? 6 : 5.5;
    const step = acc.kind === "program" ? 10 : 12;
    let out = `<g class="acc" data-id="${acc.id}">`;
    // The opaque disc keeps a faded dot from letting the curve show through.
    out += `<circle class="backing" cx="${acc.dot.cx}" cy="${acc.dot.cy}" r="${r + 1}" fill="#fff"/>`;
    out += `<g class="body">`;
    out += `<circle cx="${acc.dot.cx}" cy="${acc.dot.cy}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
    (acc.seeds?.lines || []).forEach((seed, i) => {
      out += `<text x="${acc.seeds.x}" y="${acc.seeds.y + i * 9}" font-size="7" font-family="'DejaVu Sans Mono', monospace" fill="#555">${escape(seed)}</text>`;
    });
    out += `<rect class="box" x="${acc.x}" y="${acc.y}" width="${acc.w}" height="22" rx="6" ${struct ? `fill="#f4f4f2" stroke="#888"` : `fill="#fff" stroke="${INK}" stroke-width="1.8"`}/>`;
    out += `<g class="icon" transform="translate(${acc.x + 8},${acc.y + 4})">${ICONS[acc.kind]}</g>`;
    out += `<text class="title" x="${acc.x + 28}" y="${acc.y + 14.5}" font-size="10.5" font-weight="bold">${escape(title)}</text>`;
    out += `<line class="rule" x1="${acc.x + 8}" y1="${acc.y + 21}" x2="${acc.x + acc.w - 8}" y2="${acc.y + 21}" stroke="#888" stroke-width="0.8"/>`;
    out += `<g class="lines">`;
    lines.forEach((line, i) => {
      out += `<text data-line="${i}" x="${acc.x + 8}" y="${acc.y + 32 + i * step}" ${lineAttrs(acc, line, state)}>${escape(line.text)}</text>`;
    });
    out += `</g>`;
    out += `<text class="new" ${HALO} x="${acc.x + acc.w - 8}" y="${acc.y + 14.5}" font-size="9" font-weight="bold" letter-spacing="1" fill="${ACCENT}" text-anchor="end">NEW</text>`;
    out += `</g></g>`;
    return out;
  }

  // Sets an account's drawn focus. appear scales the whole group's opacity,
  // for an account being created.
  function applyFocus(scene, g, t, appear = 1) {
    const acc = scene.accounts[g.dataset.id];
    const lineCount = g.querySelectorAll(".lines text").length;
    const full = expandedHeight(acc, Array(lineCount).fill(0));
    const expandable = lineCount > 0;
    const e = expandable ? t : 0;
    g.querySelector(".box").setAttribute("height", lerp(22, full, e));
    g.querySelector(".icon").setAttribute("transform", `translate(${acc.x + 8},${acc.y + lerp(4, 3.5, e)})`);
    g.querySelector(".title").setAttribute("y", acc.y + lerp(14.5, 14.175, e));
    g.querySelector(".rule").setAttribute("opacity", expandable ? clamp01((e - 0.6) / 0.4) : 0);
    g.querySelector(".lines").setAttribute("opacity", clamp01((e - 0.85) / 0.15));
    g.querySelector(".body").setAttribute("opacity", lerp(FADE, 1, t) * appear);
    g.querySelector(".backing").setAttribute("opacity", appear);
    g.dataset.t = t;
  }

  function arrowMarkup(arrow, { partial = false } = {}) {
    let out = `<g class="arrow" data-id="${arrow.id}">`;
    out += `<path class="stroke" d="${arrow.d}" fill="none" stroke="${ACCENT}" stroke-width="1.8" ${partial ? "" : `marker-end="url(#anim-arr)"`}/>`;
    arrow.label.forEach((text, i) => {
      out += `<text class="label" ${HALO} x="${arrow.labelAt.x}" y="${arrow.labelAt.y + i * 13}" font-size="10.5" font-weight="bold" fill="${ACCENT}" text-anchor="${arrow.labelAt.anchor || "start"}">${escape(text)}</text>`;
    });
    out += `<g class="coin label" transform="translate(${arrow.coin.x},${arrow.coin.y})" fill="#fff">${COIN}</g>`;
    out += `</g>`;
    return out;
  }

  function sceneMarkup(scene, state) {
    const { width, height } = scene.canvas;
    let out = `<defs><marker id="anim-arr" markerWidth="9" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0,0 L9,4 L0,8 z" fill="${ACCENT}"/></marker></defs>`;
    out += `<rect width="${width}" height="${height}" fill="#fff"/>`;
    out += `<text class="headline" ${HALO.replace('stroke-width="4"', 'stroke-width="4.5"')} x="16" y="24" font-size="15" font-weight="bold">${escape(state.headline)}</text>`;
    out += `<g class="background">${scene.background || ""}</g>`;
    out += `<g class="accounts">`;
    for (const id of scene.order) {
      if (state.exists.includes(id)) out += accountMarkup(scene, scene.accounts[id], state);
    }
    out += `</g><g class="arrows">`;
    for (const arrow of state.arrows) out += arrowMarkup(arrow);
    out += `</g><g class="movers"></g>`;
    return out;
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
      // states[i] is the picture once step i has finished.
      this.states = [];
      let s = initialState(scene);
      for (const step of scene.steps) {
        for (const action of step.actions) s = reduce(scene, s, action);
        this.states.push(s);
      }
      this.index = 0;
      this.render(this.states[0]);
    }

    get count() {
      return this.scene.steps.length;
    }

    render(state) {
      this.svg.innerHTML = sceneMarkup(this.scene, state);
      for (const g of this.svg.querySelectorAll(".acc")) {
        applyFocus(this.scene, g, state.focus.includes(g.dataset.id) ? 1 : 0);
        g.querySelector(".new").setAttribute("opacity", state.isNew.includes(g.dataset.id) ? 1 : 0);
      }
    }

    // Jumps to a step's end state, with no motion.
    async goto(i) {
      await this.interrupt();
      this.index = Math.max(0, Math.min(this.count - 1, i));
      this.render(this.states[this.index]);
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
      return this.goto(this.index - 1);
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
        if (this.skip) { fn(1); return resolve(); }
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
      let state = this.states[i - 1];
      this.render(state);
      for (const action of this.scene.steps[i].actions) {
        await this.animate(state, action);
        state = reduce(this.scene, state, action);
      }
      // Land exactly on the computed end state, whatever the motion left.
      this.render(this.states[i]);
    }

    accountGroup(id) {
      return this.svg.querySelector(`.acc[data-id="${id}"]`);
    }

    // Moves every account from its focus in one state to its focus in the next.
    refocus(from, to) {
      const groups = [...this.svg.querySelectorAll(".acc")];
      const starts = groups.map((g) => Number(g.dataset.t));
      const ends = groups.map((g) => (to.focus.includes(g.dataset.id) ? 1 : 0));
      return this.tween(700, (p) => groups.forEach((g, k) => applyFocus(this.scene, g, lerp(starts[k], ends[k], p))));
    }

    // Counts a line from its old value to its new one, tinted with the accent
    // while it changes, then settles back to ink.
    async changeLine(id, key, value) {
      const g = this.accountGroup(id);
      const lines = [...g.querySelectorAll(".lines text")];
      const el = lines.find((t) => (key == null ? t.dataset.line === "0" : t.textContent.startsWith(key + ": ")));
      const fromText = el.textContent;
      const toText = lineText(key, value);
      const a = numberIn(fromText);
      const b = numberIn(toText);
      el.style.transition = "fill 0.3s";
      el.style.fill = ACCENT;
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
      const next = reduce(this.scene, state, action);
      switch (action.type) {
        case "headline": {
          const el = this.svg.querySelector(".headline");
          if (el.textContent === action.text) return;
          await this.tween(250, (p) => el.setAttribute("opacity", 1 - p));
          el.textContent = action.text;
          await this.tween(250, (p) => el.setAttribute("opacity", p));
          return;
        }
        case "show":
        case "focus":
          this.render(next);
          return;
        case "call": {
          const old = [...this.svg.querySelectorAll(".arrows .arrow, .acc .new")];
          await this.tween(300, (p) => old.forEach((el) => el.setAttribute("opacity", 1 - p)));
          for (const el of this.svg.querySelectorAll(".arrows .arrow")) el.remove();
          // Light the handler line in the program box.
          for (const t of this.svg.querySelectorAll(`.acc[data-id="${this.scene.program}"] .lines text`)) {
            const active = t.textContent === action.handler;
            t.setAttribute("fill", active ? ACCENT : "#888");
            t.setAttribute("font-weight", active ? "bold" : "normal");
          }
          await this.refocus(state, next);
          return this.wait(200);
        }
        case "create": {
          const holder = document.createElementNS(SVG_NS, "g");
          holder.innerHTML = accountMarkup(this.scene, this.scene.accounts[action.id], next);
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
        case "transfer": {
          const layer = this.svg.querySelector(".arrows");
          layer.insertAdjacentHTML("beforeend", arrowMarkup(action.arrow, { partial: true }));
          const g = layer.lastElementChild;
          const path = g.querySelector(".stroke");
          const labels = [...g.querySelectorAll(".label")];
          labels.forEach((el) => el.setAttribute("opacity", 0));
          const length = path.getTotalLength();
          path.setAttribute("stroke-dasharray", `${length} ${length}`);
          await this.tween(500, (p) => path.setAttribute("stroke-dashoffset", length * (1 - p)));
          path.removeAttribute("stroke-dasharray");
          path.removeAttribute("stroke-dashoffset");
          path.setAttribute("marker-end", "url(#anim-arr)");
          // The tokens leave the source as a coin sets off along the arrow,
          // and arrive in the destination as it lands.
          const mover = document.createElementNS(SVG_NS, "g");
          mover.innerHTML = COIN;
          mover.setAttribute("fill", "#fff");
          this.svg.querySelector(".movers").appendChild(mover);
          const leaving = this.changeLine(action.from.id, action.from.key, action.from.value);
          await this.tween(1100, (p) => {
            const pt = path.getPointAtLength(length * p);
            mover.setAttribute("transform", `translate(${pt.x},${pt.y})`);
          });
          mover.remove();
          await Promise.all([leaving, this.changeLine(action.to.id, action.to.key, action.to.value)]);
          await this.tween(300, (p) => labels.forEach((el) => el.setAttribute("opacity", p)));
          return this.wait(200);
        }
        default:
          throw new Error(`unknown action ${action.type}`);
      }
    }
  }

  window.AccountAnimation = { Player, reduce, sceneMarkup, ICONS, COIN, ACCENT, INK, SANS };
})();
