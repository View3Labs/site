# View3Labs · site 🌙

The official View3Labs website: a single static page, no frameworks, no CMS, no third-party scripts. Small on purpose — the fewer moving parts, the fewer ways to tamper with the one thing that matters here: the official links and, at deploy, the official contract address.

## How it works

- `index.html` is the whole site: hero, the Founder NFT (963), mint status, official links, trust.
- `links/index.html` redirects `view3labs.com/links` to the links section.
- The mint section is driven by the `MINT` config at the bottom of `index.html`. Until deploy it shows the standing warning: **nothing is deployed, anything claiming to be us is fake.**
- At deploy, one commit flips `deployed: true` and sets `address` and `mintUrl`. The page then shows the one official address and reads the live minted count straight from the chain (a raw JSON-RPC call, no libraries).
- Every change to this page is a public commit. That is deliberate: the history of the mint link is on the record.

## Deploy

GitHub Pages: Settings → Pages → Deploy from branch → `main`, root. Point `view3labs.com` at it with a `CNAME` file and the DNS records GitHub Pages documents. Cloudflare Pages works identically if preferred.

## Rules

- No external scripts or stylesheets, ever. If it needs a library, it does not go on this page.
- The contract address changes only by commit, only by the founder, mirrored in the one Discord channel.
- Nothing here is financial advice.

---

Code: MIT · Content: © View3Labs, all rights reserved
