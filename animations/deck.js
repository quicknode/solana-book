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
  function marked(text) {
    return escape(text)
      .replace(/\[([^\]]+)\]/g, "<mark>$1</mark>")
      .replace(/\{([^}]+)\}/g, '<mark class="purple">$1</mark>');
  }

  // The book's account glyphs, in the card's own text colour.
  function icon(kind) {
    const { ICONS, THEME } = AccountAnimation;
    return `<svg viewBox="0 0 14 14">${ICONS[kind].replaceAll(THEME.boxText, "currentColor")}</svg>`;
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
      <div class="slide ${s.tone || "dark"}">
        <div class="body cards-slide">
          ${s.tag ? `<span class="tag purple">// ${escape(s.tag)}</span><div style="height:3cqw"></div>` : ""}
          ${s.heading ? `<h2 class="heading">${marked(s.heading)}</h2>` : ""}
          <div class="cards ${s.cards.length > 3 ? "five" : ""}">
            ${s.cards
              .map(
                (c, i) => `<div class="card ${c.tone} ${i < shown ? "" : "waiting"}">${icon(c.icon)}
                  <div class="name">${marked(c.name)}</div><div class="text">${marked(c.text)}</div></div>`,
              )
              .join("")}
          </div>
        </div>
      </div>`,

    qr: (s, deck) => `
      <div class="slide dark qr-slide">${bar(deck.series)}
        <div class="body">
          <h2>${marked(s.heading)}</h2>
          <div class="url">${escape(s.url)}</div>
          <div class="row"><img src="${s.qr}" alt="QR code for ${escape(s.url)}">
            <ul>${s.items.map((i) => `<li>${marked(i)}</li>`).join("")}</ul></div>
        </div>
      </div>`,

    follow: (s, deck) => `
      <div class="slide mint follow-slide">${bar(deck.series)}
        <div class="body">
          <span class="tag green">// ${escape(s.tag)}</span>
          <div class="lead">${marked(s.lead)}</div>
          <div class="handle-big">${marked(s.handle)}</div>
        </div>
        <div class="thanks">${escape(s.thanks)}</div>
      </div>`,
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
      this.player = new AccountAnimation.Player(scene, this.svg);
      this.autoplay = null;

      // One entry per key press: each diagram step, and each build of a slide.
      this.items = [];
      for (const slide of deck.slides) {
        if (slide.type === "diagram") {
          for (let i = slide.from; i <= slide.to; i++) this.items.push({ step: i });
        } else {
          const builds = slide.type === "cards" ? slide.cards.length : 1;
          for (let shown = 1; shown <= builds; shown++) this.items.push({ slide, shown });
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
        const waiting = this.html.querySelectorAll(".card.waiting");
        if (waiting[0]) waiting[0].classList.remove("waiting");
        return;
      }
      this.html.innerHTML = RENDER[item.slide.type](item.slide, this.deck, item.shown);
      this.html.classList.remove("hidden");
      this.svg.classList.add("hidden");
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
