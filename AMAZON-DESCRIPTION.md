# Amazon product description

*The book description for the Amazon listing, written to fit the field's 4,000 character limit. Amazon does not render Markdown: enter the bullets with the KDP editor's list button, or as `<ul><li>`.*

---

“If this book had existed sooner, I would have been very early to Solana. It’s still very early. First inning. All financial and AI players need to pick this book up and start building.”

— Iqram Magdon-Ismail, cofounder of Venmo

**Building Financial Software on Solana** is the definitive guide to turning financial products into Solana programs, the code other blockchains call “smart contracts”. It builds ten complete, tested financial products, each from the primitives up:

- An escrow, letting two strangers trade assets without either one trusting the other
- A Kickstarter-style fundraiser, where backers get their money back unless the full target is raised
- A betting market, using the pool-betting model of racetracks
- An order book exchange, like the ones NYSE and Nasdaq run
- An AMM, the standard venue for launching new tokens with little trading volume
- A proprietary AMM, where a market maker quotes oracle prices with its own capital
- Lending and borrowing, with interest and liquidations
- A managed fund, where a fund manager picks stocks and earns fees but can never withdraw the investors' capital
- An options exchange
- Perpetual futures

Along the way, it teaches the essential topics for handling assets onchain:

- How programs store state
- How to do money arithmetic in whole numbers so rounding never leaks a cent
- How a program checks prices and other facts from outside the chain before acting on them
- How onchain money gets stolen and the checks that stop it, with the real incidents where those checks were missing: Wormhole ($326M), Mango Markets ($116M) and Cashio ($48M)

Solana moves fast, but this book teaches the layer that does not change: accounts, instruction handlers, the arithmetic of money, and the checks that keep a program secure. The code for every program, in popular frameworks including Anchor 1, Anchor 2 and Quasar, lives in an open companion repository, so the book stays true while the code stays up to date. A companion AI plugin applies the book's rules inside AI coding tools.

No Solana experience is assumed, and no finance background either. Every mechanism and every financial concept is built from first principles, with named characters, real dollar amounts on the page, and diagrams explaining each step. Every chapter was technically reviewed by engineers and founders from companies including Anza, Blueshift, Neodyme, Accretion and the Solana Foundation.
