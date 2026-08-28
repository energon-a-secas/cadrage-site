<div align="center">

# Cadrage

Review camera settings to find the ones that contradict each other, do nothing, or get corrected twice in post

[![Live][badge-site]][url-site]
[![HTML5][badge-html]][url-html]
[![CSS3][badge-css]][url-css]
[![JavaScript][badge-js]][url-js]
[![Claude Code][badge-claude]][url-claude]
[![License][badge-license]](LICENSE)

[badge-site]:    https://img.shields.io/badge/live_site-0063e5?style=for-the-badge&logo=googlechrome&logoColor=white
[badge-html]:    https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white
[badge-css]:     https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white
[badge-js]:      https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[badge-claude]:  https://img.shields.io/badge/Claude_Code-CC785C?style=for-the-badge&logo=anthropic&logoColor=white
[badge-license]: https://img.shields.io/badge/license-MIT-404040?style=for-the-badge

[url-site]:   https://cadrage.neorgon.com/
[url-html]:   #
[url-css]:    #
[url-js]:     #
[url-claude]: https://claude.ai/code

</div>

---

## Overview

Cadrage teaches one camera properly instead of every camera vaguely. Learn the exposure triangle and focus from basics to advanced, walk through a video or photo setup step by step, and do it all on a replica of the Sony a6700 menu transcribed from the official help guide. Underneath sits a 26-rule review that reads your whole setup (room, lens and edit included) and names the settings that contradict each other, do nothing, or get corrected twice in post, with every claim carrying its provenance.

**Live:** cadrage.neorgon.com

---

## Features

- **Learn** -- 24 lessons in six tracks, basics before advanced: the exposure triangle, focus, colour, light and flicker, formats, post
- **Walkthrough** -- ordered passes for video and photography; video steps can write their argued-for values straight into the active setup
- **Camera** -- the a6700 menu as the body shows it: 8 tabs, 280 rows transcribed from the help guide, live controls where the setup models a row and honest documentation where it does not
- **Review** -- 26 rules that lint the setup, each finding naming whether it rests on physics, Sony spec, convention, your notes, or nothing verifiable
- **Calculators** -- flicker, depth of field, backdrop spill, exposure equivalence, card time

---

## Running locally

ES modules require an HTTP server (not `file://`):

```bash
make serve
```

Or manually:

```bash
python3 -m http.server 8000
```

---

## Architecture

```
cadrage-site/
├── index.html          # HTML shell
├── css/
│   ├── style.css       # Shared primitives
│   ├── learn.css       # Lessons and walkthrough
│   └── camera.css      # The a6700 replica
├── js/
│   ├── app.js          # Entry point, imports and initializes
│   ├── state.js        # Shared state, localStorage
│   ├── render.js       # View switch, derived-zone patching
│   ├── events.js       # Every writer: data-path, camera cursor, progress
│   ├── engine/         # rules, interactions, calc, lint
│   ├── data/           # setup shape, live rows, menu tree, lessons, walkthroughs
│   └── views/          # learn, walkthrough, camera, review, quick-edit, tools
├── tests/              # engine.test.mjs + content.test.mjs (make test)
├── favicon.ico
├── energon-classic-logo.png
├── robots.txt
├── sitemap.xml
├── CNAME
├── Makefile
└── README.md
```

---

<div align="center">
<sub>Part of <a href="https://neorgon.com/">Neorgon</a></sub>
</div>
