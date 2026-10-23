// A slide deck around an animated scene. A deck is a list of slides: some are
// HTML (title, what you'll learn, cards, closing), and some are a run of the
// scene's diagram steps. One key advances through all of them: a diagram step
// plays its animation, and a slide of cards builds them one at a time.
//
// The deck has the same small interface as the diagram player (count, goto,
// next, prev, autoplay), so the page's keys and scripts/animation-frames.mjs
// drive either.

(function () {
  const escape = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // [word] becomes the green highlight; {word} the purple one.
  // A handler name, "deposit()", is bold wherever it appears.
  function marked(text) {
    return escape(text)
      .replace(/\[([^\]]+)\]/g, "<mark>$1</mark>")
      .replace(/\{([^}]+)\}/g, '<mark class="purple">$1</mark>')
      .replace(/\b[a-z][a-z0-9_]*\(\)/g, "<b>$&</b>");
  }

  // A card's icon: one of the book's account glyphs by kind ("wallet",
  // "token", ...), drawn in the card's text colour, or with "tpl:" one of the
  // Quicknode template's icons in assets/icons, inverted on a dark card.
  function icon(kind, deck) {
    if (kind.startsWith("tpl:")) {
      return `<img class="tpl-icon" src="${deck.assets}icons/${kind.slice(4)}.png" alt="">`;
    }
    const { ICONS, THEME } = AccountAnimation;
    return `<svg viewBox="0 0 14 14">${ICONS[kind].replaceAll(THEME.boxText, "currentColor")}</svg>`;
  }

  const waiting = (i, shown) => (i < shown ? "" : "waiting");

  function heading(s) {
    return `${s.heading ? `<h2 class="slide-heading">${marked(s.heading)}</h2>` : ""}${
      s.sub ? `<p class="slide-sub">${marked(s.sub)}</p>` : ""
    }`;
  }

  // The payoff of an option at expiry, against the underlying's price: one
  // line per side, built one at a time. Each series is a list of [price, profit].
  function payoffChart(s, shown) {
    const W = 900, H = 420, L = 70, R = 30, T = 20, B = 50;
    const [x0, x1] = s.x, [y0, y1] = s.y;
    const X = (v) => L + ((v - x0) / (x1 - x0)) * (W - L - R);
    const Y = (v) => T + ((y1 - v) / (y1 - y0)) * (H - T - B);
    let out = `<svg class="chart" viewBox="0 0 ${W} ${H}">`;
    for (let v = y0; v <= y1; v += s.yStep) {
      out += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="${v === 0 ? "zero" : "gridline"}"/>`;
      out += `<text x="${L - 10}" y="${Y(v) + 5}" text-anchor="end" class="tick">${v > 0 ? "+" : ""}${v}</text>`;
    }
    for (let v = x0; v <= x1; v += s.xStep) {
      out += `<text x="${X(v)}" y="${H - B + 24}" text-anchor="middle" class="tick">$${v}</text>`;
    }
    for (const m of s.marks || []) {
      out += `<line x1="${X(m.at)}" x2="${X(m.at)}" y1="${T}" y2="${H - B}" class="mark-line"/>`;
      out += `<text x="${X(m.at) + 6}" y="${T + 14}" class="mark-label">${escape(m.label)}</text>`;
    }
    s.series.forEach((series, i) => {
      const d = series.points.map(([px, py], k) => `${k ? "L" : "M"} ${X(px)},${Y(py)}`).join(" ");
      const [lx, ly] = series.labelAt;
      out += `<g class="series ${series.tone} ${waiting(i, shown)}"><path d="${d}"/>`;
      out += `<text x="${X(lx)}" y="${Y(ly)}" class="series-label">${escape(series.label)}</text></g>`;
    });
    out += `<text x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle" class="axis">${escape(s.xLabel)}</text>`;
    out += `<text x="16" y="${(T + H - B) / 2}" text-anchor="middle" class="axis" transform="rotate(-90 16 ${(T + H - B) / 2})">${escape(s.yLabel)}</text>`;
    return out + "</svg>";
  }

  function bar(series) {
    return `<div class="bar"><span class="mark"></span><span>${escape(series)}</span><span class="handle">@QuicknodeSolana</span></div>`;
  }

  // Each slide kind renders to HTML; `shown` is how many of its cards have
  // been built so far.
  const RENDER = {
    title: (s, deck) => `
      <div class="slide dotted title-slide">${bar(deck.series)}
        <div class="body">
          <span class="tag outline">// ${escape(deck.series)}</span>
          <h1>${s.lines.map(marked).join("<br>")}</h1>
        </div>
        <div class="logo"><span class="mark"></span></div>
      </div>`,

    columns: (s, deck) => `
      <div class="slide lavender">${bar(deck.series)}
        <div class="body columns">
          ${s.columns
            .map(
              (c) => `<div><h2>${marked(c.heading)}</h2><p class="sub">${escape(c.sub || "")}</p>
                <ul>${c.items.map((i) => `<li>${marked(i)}</li>`).join("")}</ul></div>`,
            )
            .join("")}
        </div>
      </div>`,

    cards: (s, deck, shown) => `
      <div class="slide ${s.tone || "dark"}">${bar(deck.series)}
        <div class="body cards-slide">
          ${s.tag ? `<span class="tag purple">// ${escape(s.tag)}</span><div style="height:3cqw"></div>` : ""}
          ${s.heading ? `<h2 class="heading">${marked(s.heading)}</h2>` : ""}
          <div class="cards ${s.cards.length > 3 ? "five" : ""}">
            ${s.cards
              .map(
                (c, i) => `<div class="card ${c.tone} ${waiting(i, shown)}">${icon(c.icon, deck)}
                  <div class="name">${marked(c.name)}</div><div class="text">${marked(c.text)}</div></div>`,
              )
              .join("")}
          </div>
        </div>
      </div>`,

    // A big centred sentence, and a line beneath it.
    statement: (s, deck) => `
      <div class="slide ${s.tone || "dark"}">${bar(deck.series)}
        <div class="statement"><h2>${marked(s.heading)}</h2>${s.sub ? `<p>${marked(s.sub)}</p>` : ""}</div>
      </div>`,

    // Two people side by side, each a full-height panel: who they are, what
    // they want, and why. Built one panel at a time.
    versus: (s, deck, shown) => `
      <div class="slide dark">${bar(deck.series)}
        <div class="versus">${s.cards
          .map(
            (c, i) => `<div class="panel ${c.tone} ${waiting(i, shown)}">${icon(c.icon, deck)}
              <div class="who">${escape(c.who)}</div><h2>${marked(c.name)}</h2><p>${marked(c.text)}</p></div>`,
          )
          .join("")}</div>
      </div>`,

    // A big centred sentence over one of the template's photographs, which
    // drifts slowly closer while the slide is up.
    photo: (s, deck) => `
      <div class="slide light photo-slide">${bar(deck.series)}
        <div class="photo" style="background-image:url('${s.image}')"></div>
        <div class="statement"><h2>${marked(s.heading)}</h2>${s.sub ? `<p>${marked(s.sub)}</p>` : ""}</div>
      </div>`,

    // The heading on the left, and a stack of wide icon cards on the right.
    split: (s, deck, shown) => `
      <div class="slide ${s.tone || "light"}">${bar(deck.series)}
        <div class="body split"><div>${heading(s)}</div>
          <div class="stack">${s.cards
            .map(
              (c, i) => `<div class="row-card ${waiting(i, shown)}">${icon(c.icon, deck)}
                <div><div class="name">${marked(c.name)}</div><div class="text">${marked(c.text)}</div></div></div>`,
            )
            .join("")}</div>
        </div>
      </div>`,

    // The heading across the top, and a grid of centred icon cards.
    grid: (s, deck, shown) => `
      <div class="slide ${s.tone || "light"}">${bar(deck.series)}
        <div class="body">${heading(s)}
          <div class="grid cols-${s.columns || 3}">${s.cards
            .map(
              (c, i) => `<div class="grid-card ${waiting(i, shown)}">${icon(c.icon, deck)}
                <div class="name">${marked(c.name)}</div><div class="text">${marked(c.text)}</div></div>`,
            )
            .join("")}</div>
        </div>
      </div>`,

    // Cards numbered with a green tag, for things that happen in order or
    // are counted.
    numbered: (s, deck, shown) => `
      <div class="slide ${s.tone || "dark"}">${bar(deck.series)}
        <div class="body">${heading(s)}
          <div class="cards numbered">${s.cards
            .map(
              (c, i) => `<div class="card ${s.tone === "dark" || !s.tone ? "slab" : "white"} ${waiting(i, shown)}">
                <span class="tag green">// ${String(i + 1).padStart(2, "0")}</span>
                <div class="name">${marked(c.name)}</div><div class="text">${marked(c.text)}</div></div>`,
            )
            .join("")}</div>
        </div>
      </div>`,

    // A bar split by value, each part labelled with its share of the whole:
    // a fund's allocation, or who owns its shares.
    // With `from`, a part opens at an earlier value and grows or shrinks to
    // its own, the bar, its percentage and its words changing together: the
    // weights drifting as a price moves, or a rebalance pulling them back.
    allocation: (s, deck) => {
      const total = s.parts.reduce((sum, p) => sum + p.value, 0);
      const fromTotal = s.parts.reduce((sum, p) => sum + (p.from ?? p.value), 0);
      const pct = (v, t = total) => ((v / t) * 100).toFixed(s.decimals ?? 0);
      // A part moving to or from nothing may be as thin as nothing, and its
      // words leave or arrive with it.
      const moving = (p) => (p.from != null ? ` moving${p.value === 0 ? " to-zero" : ""}${p.from === 0 ? " from-zero" : ""}` : "");
      const motion = (p) =>
        p.from != null
          ? ` data-grow="${p.value}" data-pct-from="${pct(p.from, fromTotal)}" data-pct-to="${pct(p.value)}" data-decimals="${s.decimals ?? 0}"`
          : "";
      return `
      <div class="slide ${s.tone || "dark"}">${bar(deck.series)}
        <div class="body">${heading(s)}
          <div class="alloc" data-delay="${s.delay ?? 700}">${s.parts
            .map((p) =>
              // A part too thin to hold its words is drawn at its true width,
              // with its label outside the bar and an arrow to it.
              p.callout
                ? `<div class="seg thin${moving(p)}" style="flex-grow:${p.from ?? p.value}"${motion(p)}><div class="pct">&nbsp;</div>
                    <div class="seg-box ${p.tone}"></div>
                    <div class="callout"><span class="callout-name">${marked(p.name)}</span> · ${marked(p.text)} · ${pct(p.value)}%</div></div>`
                : p.from != null
                  ? `<div class="seg${moving(p)}" style="flex-grow:${p.from}"${motion(p)}>
                <div class="pct">${pct(p.from, fromTotal)}%</div>
                <div class="seg-box ${p.tone}">${p.icon ? icon(p.icon, deck) : ""}
                  <div class="name">${marked(p.name)}</div><div class="text" data-to="${escape(marked(p.text))}">${marked(p.fromText || p.text)}</div></div></div>`
                  : `<div class="seg" style="flex-grow:${p.value}">
                <div class="pct">${pct(p.value)}%</div>
                <div class="seg-box ${p.tone}">${p.icon ? icon(p.icon, deck) : ""}
                  <div class="name">${marked(p.name)}</div><div class="text">${marked(p.text)}</div></div></div>`,
            )
            .join("")}</div>
        </div>
      </div>`;
    },

    chart: (s, deck, shown) => `
      <div class="slide ${s.tone || "dark"}">${bar(deck.series)}
        <div class="body">${heading(s)}${payoffChart(s, shown)}</div>
      </div>`,

    // A link to share: the heading, its address, bullets and a QR code, and
    // with `cover` the book's cover beside them.
    qr: (s, deck) => s.cover
      ? `
      <div class="slide dark qr-slide with-cover">${bar(deck.series)}
        <div class="body">
          <div>
            <h2>${marked(s.heading)}</h2>
            <div class="url">${escape(s.url)}</div>
            <ul>${s.items.map((i) => `<li>${marked(i)}</li>`).join("")}</ul>
            <img class="qr" src="${s.qr}" alt="QR code for ${escape(s.url)}">
          </div>
          <img class="cover" src="${s.cover}" alt="">
        </div>
      </div>`
      : `
      <div class="slide dark qr-slide">${bar(deck.series)}
        <div class="body">
          <h2>${marked(s.heading)}</h2>
          <div class="url">${escape(s.url)}</div>
          <div class="row"><img src="${s.qr}" alt="QR code for ${escape(s.url)}">
            <ul>${s.items.map((i) => `<li>${marked(i)}</li>`).join("")}</ul></div>
        </div>
      </div>`,

    // The closing slide: the talk's own picture, a cluster curve drawing
    // itself across the slide with accounts appearing on it, and above it a
    // token transfer between two accounts off either edge, coins streaming
    // along its arrow.
    follow: (s, deck) => {
      const coin = [[10, 3], [0, 0], [-10, 3]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join("");
      // A transfer between two accounts off either edge, beneath the handle.
      const arrow = "M -80,620 L 1680,620";
      const coins = [0, 1, 2, 3]
        // Each coin is hidden until its first run starts, then runs edge to edge.
        .map((k) => `<g class="coin" visibility="hidden">${coin}<set attributeName="visibility" to="visible" begin="${1.4 + k * 1.5}s"/><animateMotion dur="6s" begin="${1.4 + k * 1.5}s" repeatCount="indefinite" path="${arrow}"/></g>`)
        .join("");
      return `
      <div class="slide dark follow-slide">${bar(deck.series)}
        <svg class="follow-transfer" viewBox="0 0 1600 840" aria-hidden="true">
          <path class="transfer" d="${arrow}"/>${coins}
        </svg>
        <div class="body">
          <span class="tag green">// ${escape(s.tag)}</span>
          <div class="lead">${marked(s.lead)}</div>
          <div class="handle-big">${marked(s.handle)}</div>
        </div>
        <div class="thanks">${escape(s.thanks)}</div>
      </div>`;
    },
  };

  class Deck {
    constructor(deck, scene, stage) {
      this.deck = deck;
      this.scene = scene;
      this.stage = stage;
      this.svg = stage.querySelector("svg");
      this.svg.classList.add("layer");
      this.html = document.createElement("div");
      this.html.className = "layer";
      stage.appendChild(this.html);
      // The series bar sits above the diagrams too, as on every slide.
      stage.insertAdjacentHTML("afterbegin", `<div class="diagram-bar slide dark">${bar(deck.series)}</div>`);
      this.player = new AccountAnimation.Player(scene, this.svg);
      this.autoplay = null;

      // One entry per key press: each diagram step, and each build of a slide.
      this.items = [];
      for (const slide of deck.slides) {
        if (slide.type === "diagram") {
          for (let i = slide.from; i <= slide.to; i++) this.items.push({ step: i });
        } else {
          // A slide of cards, or a chart's lines, builds one per key press.
          const parts = slide.cards || slide.series;
          if (parts && slide.build !== false) {
            for (let shown = 1; shown <= parts.length; shown++) this.items.push({ slide, shown });
          } else {
            this.items.push({ slide, shown: parts ? parts.length : 1 });
          }
        }
      }
      const steps = this.items.filter((it) => "step" in it).length;
      if (steps !== scene.steps.length) {
        throw new Error(`the deck shows ${steps} diagram steps; the scene has ${scene.steps.length}`);
      }
      this.index = 0;
      this.show(0, false);
    }

    get count() {
      return this.items.length;
    }

    get busy() {
      return this.player.busy;
    }

    async show(i, forward) {
      const item = this.items[i];
      const prev = forward ? this.items[i - 1] : null;
      if ("step" in item) {
        this.html.classList.add("hidden");
        this.svg.classList.remove("hidden");
        if (forward && item.step > 0) {
          // Land on the step before without motion, then play this one.
          if (this.player.index !== item.step - 1 || !(prev && "step" in prev)) await this.player.goto(item.step - 1);
          await this.player.next();
        } else {
          await this.player.goto(item.step);
        }
        return;
      }
      const sameSlide = prev && prev.slide === item.slide;
      if (sameSlide) {
        // Build the next card in place.
        const next = this.html.querySelector(".waiting");
        if (next) next.classList.remove("waiting");
        return;
      }
      this.html.innerHTML = RENDER[item.slide.type](item.slide, this.deck, item.shown);
      this.html.classList.remove("hidden");
      this.svg.classList.add("hidden");
      this.moveAllocation();
    }

    // Moves an allocation's parts from their `from` values to their own once
    // the slide has faded in: the bars grow, the percentages count, and the
    // words change as the move ends.
    moveAllocation() {
      const segs = [...this.html.querySelectorAll(".seg[data-grow]")];
      if (segs.length === 0) return;
      const delay = Number(this.html.querySelector(".alloc").dataset.delay);
      setTimeout(() => {
        for (const seg of segs) {
          seg.style.flexGrow = seg.dataset.grow;
          seg.classList.add("moved");
        }
        const start = performance.now();
        const frame = (now) => {
          const p = Math.min(1, (now - start) / 1600);
          const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
          for (const seg of segs) {
            if (seg.classList.contains("thin")) continue;
            const a = Number(seg.dataset.pctFrom), b = Number(seg.dataset.pctTo);
            seg.querySelector(".pct").textContent = `${(a + (b - a) * e).toFixed(Number(seg.dataset.decimals))}%`;
          }
          if (p < 1) return requestAnimationFrame(frame);
          for (const seg of segs) {
            const text = seg.querySelector(".text");
            if (text) text.innerHTML = text.dataset.to;
          }
        };
        requestAnimationFrame(frame);
      }, delay);
    }

    async goto(i) {
      await this.player.interrupt();
      this.index = Math.max(0, Math.min(this.count - 1, i));
      await this.show(this.index, false);
    }

    async next() {
      if (this.player.busy) return this.player.interrupt();
      if (this.index >= this.count - 1) return;
      this.index += 1;
      await this.show(this.index, true);
    }

    prev() {
      this.stopAutoplay();
      return this.goto(this.index - 1);
    }

    // Plays every remaining item, holding each finished one for `hold` ms.
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
  }

  window.AccountDeck = { Deck };
})();
