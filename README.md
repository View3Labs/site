# View3Labs · site 🌙

The official View3Labs website, pre-launch edition: the hero holding page and the Official links page. Static files only, no frameworks, no CMS, no third-party scripts. Small on purpose: the fewer moving parts, the fewer ways to tamper with the one thing that matters here, the official links and, at deploy, the official contract address.

## How it works

- `index.html` is the holding page: the hero, the Litepaper link, the X, Notion and GitHub icons, and an "Official links" button.
- `links/index.html` is the Official links page, with the Mint status block beneath it. `view3labs.com/links` lands here.
- `style.css`, `app.js`, `fonts/` and `assets/` are self-hosted. Nothing loads from a CDN.
- The Mint status block is driven by `SITE_CONFIG` at the top of `app.js`. While `contractAddress` and `mintUrl` are empty it shows the standing warning: **nothing is deployed, anything claiming to be us is fake.** At deploy, one commit sets both values and the block flips to the one official address and the official mint page. `discordInvite` replaces "Coming soon" on the links page the same way.
- No wallet connection, ever. The site links out; it never asks anyone to connect or sign.
- Every change to this site is a public commit. That is deliberate: the history of the mint link is on the record.

## Deploy

GitHub Pages: Settings → Pages → Deploy from branch → `main`, root. Point `view3labs.com` at it with a `CNAME` file and the DNS records GitHub Pages documents. Cloudflare Pages works identically if preferred.

## Rules

- No external scripts or stylesheets, ever. If it needs a library, it does not go on this site.
- The contract address changes only by commit, only by the founder, mirrored in the one Discord channel.
- Nothing here is financial advice.

---

Code: MIT · Content: © View3Labs, all rights reserved
