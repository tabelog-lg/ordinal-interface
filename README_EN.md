# Ordinal Interface 1 v1.5.4 — Web Edition

> A visual browser for large countable ordinal notations, ported from a
> .NET Framework 4.8 WinForms application to the browser.

The original program comes from the Chinese googology community. Its central design decision is that
**the program itself performs no ordinal arithmetic** — the actual notation system is supplied by an
external "ordinal notation" plug-in, and the two talk over
**ONP2 (Ordinal Notation Protocol 2)**. This web edition keeps that design intact; only the plug-in
form changes, from *console exe + stdin/stdout* to *JS module + synchronous function calls*.

🔗 **Live demo**: `https://tabelog-lg.github.io/ordinal-interface/` (available once the GitHub Actions run finishes)
　 Self-test page: `https://tabelog-lg.github.io/ordinal-interface/selftest.html`

🌏 [中文说明](./README.md)

---

## 1. What it looks like

Five tabs, one-to-one with the original:

| Tab | What it does |
|---|---|
| **Notation** | Lists available notation systems; add / remove plug-ins |
| **Misc** | Expand ordinal · ordinal type · comparison · predecessor |
| **Expansion tree** | Click a limit ordinal row to expand its fundamental sequence; scroll wheel to move |
| **Ruler** | Wheel to zoom, all the way along 0 → 1 → … → ω → ω·2 → … → ω² |
| **Settings** | Colours, alignment mode, dense ticks / continuous expansion, config import & export |

The built-in notation `Omega2 (w^2)` was ported line by line from
`examples/Omega2Notation/Program.vb`. Expressions are plain ASCII:
`0` `5` `w` `w*3` `w*3+7` `Limit` (= ω²).

UI strings are kept verbatim from the original (in Chinese):
*表达式不正确* / *序号不正确* / *表达式不是极限序数* / *表达式不是后继序数* / *极限序数* / *后继序数*.

---

## 2. Running locally

```bash
npm install
npm run dev      # dev server
npm run build    # emit to dist/ (runs the TypeScript type check first)
npm run preview  # preview the build output
```

> `dist/` uses ES modules, so it **cannot be opened via `file://`** — serve it over HTTP:
> `cd dist && python3 -m http.server 8000`

## 3. Deployment

The repo ships with `.github/workflows/deploy.yml`: pushing to `main` builds and publishes to
GitHub Pages automatically.

`vite.config.ts` sets `base: './'`, so every asset path is relative and the site works under a
sub-path such as `https://xxx.github.io/<repo>/` — **renaming the repo requires no config change**.

## 4. Tests

```bash
npx esbuild tests/verify.ts --bundle --platform=node --format=esm --outfile=/tmp/verify.mjs
node /tmp/verify.mjs
```

45 assertions covering the five protocol commands, expression parsing/formatting, the `Limit` and `0`
short-circuits, expression validation, ruler initialisation and continuous zooming (including the
out-of-bounds path when zooming all the way out to the top level, and 40 rounds of zooming back and
forth), tree expansion on click (including the bug 1 fix), and scrolling.

There is also an **in-browser self-test** at `selftest.html` (dev only): it draws into real canvases
and verifies that pixels actually appear. Results are printed on the page and the tab title turns
into `SELFTEST-PASS` or `SELFTEST-FAIL`.

---

## 5. Project layout

```
src/
├─ main.ts                 entry point: tab switching, engine loading
├─ style.css
├─ engine/
│  ├─ types.ts            ONP2 protocol definition (commands 1~5)
│  ├─ omega2.ts           the ω² notation, ported line by line from Program.vb
│  ├─ host.ts             engine host: six actions + result caching
│  └─ plugins.ts          plug-in registry (built-in + user-uploaded, source in IndexedDB)
├─ core/
│  ├─ dlist.ts            minimal doubly-linked list
│  ├─ ruler.ts            ruler state machine (bisection tree + same-level list)
│  ├─ tree.ts             expansion tree state machine
│  └─ state.ts            global settings + persistence
└─ ui/
   ├─ dom.ts              HiDPI canvas, wheel-event normalisation
   ├─ rulerView.ts        ruler rendering
   ├─ treeView.ts         expansion tree rendering
   ├─ misc.ts             Misc tab
   ├─ settings.ts         Settings tab
   └─ plugins.ts          Notation tab
tests/verify.ts            logic self-test (no DOM required)
docs/                      source material: protocol text, original project README, identifier map
public/plugins/            plug-in template
```

**Layering rule**: `core/` is a pure state machine — it knows nothing about the DOM and takes the
engine host by injection, which is exactly why `tests/verify.ts` can exercise all core logic under
node. `ui/` only draws and collects events.

---

## 6. Writing your own notation plug-in

A plug-in is a **self-contained ES module** (do not import other local files) whose default export
implements the five ONP2 methods:

```js
export default {
  name: 'My Notation',

  // Command 1: term a of the fundamental sequence of the largest ordinal, Limit
  fsLimit(a) { return /* ... */ },
  // Command 2: ordinal type — "1"=0 / "2"=successor / "3"=limit
  typeOf(a)  { return /* ... */ },
  // Command 3: predecessor (return "0" as a fallback for limit ordinals and 0)
  pred(a)    { return /* ... */ },
  // Command 4: term a of the fundamental sequence of ordinal b
  fs(a, b)   { return /* ... */ },
  // Command 5: a < b ?
  less(a, b) { return /* ... */ },
};
```

Protocol notes:

- All five methods must be **pure functions** — the host caches results by input.
  `FirstExceeding` is a linear ascending scan that can issue dozens of queries per call, and a
  wheel spin multiplies that into hundreds; without caching it visibly stutters.
- The host short-circuits `Limit` (always a limit ordinal, always greater than anything) and `0`
  (always the minimum), but your plug-in **should still handle both correctly**, since commands 1
  and 4 pass them through for real.
- When the result is 0, always return the string `"0"`.

Hit "Download plug-in template" for a skeleton; `public/plugins/omega2-example.js` is a complete,
runnable reference implementation.

---

## 7. Differences from the original

### Changes forced by the platform

| Original | Web edition |
|---|---|
| Plug-in is a local console exe talking over stdin/stdout | Plug-in is a JS module called synchronously |
| Config in the hidden file `1` next to the executable | localStorage + JSON (exportable; old configs can be imported) |
| Stores the absolute path of a plug-in exe | Stores a plug-in id; the source lives in IndexedDB |
| `OpenFileDialog` / `ColorDialog` | `<input type="file">` / `<input type="color">` |
| `Timer1` + `TopMost` (to stop the console stealing focus) | Removed — meaningless in a browser |
| `probeProcess` (handshake check, leftover processes) | Removed — replaced by reading the plug-in's `name` |

### Bug fixes (section 6 of the original README)

1. **Repeated clicks in the expansion tree**: the original wrote a **pixel coordinate** into
   `Levels(0)`, so a second click on the same row entered the "expand again" branch and treated that
   pixel value as a fundamental-sequence index, incrementing it — producing nonsense. Now the value
   written is the actual index used by `FirstExceeding`, so a second click lands exactly on the next
   term of the sequence (verified: ω → ω·2).
2. **The root node's adjacency array had only 4 slots** (every other node has 6): one branch of
   zooming out could run out of bounds, and the two boundary nodes (`"0"` / `"Limit"`) had no
   adjacency array at all. All nodes now have 6 slots, and `CreateChild` / `CreateSibling` **return
   failure instead of crashing** when nothing can be created; callers clamp the viewport accordingly.
3. **`ValidateExpression` relied on `engineProcess.Responding`** to detect a hang, and then called
   `Start()` on an already-running process (which throws, with no try/catch). Now there is an
   **iteration cap** — this loop has a genuine infinite-loop path, and without a cap a slightly
   off-spec plug-in would freeze the whole page.

### Robustness improvements added in the web edition

- **Empty-node guard**: when zooming "up", the child produced by `CreateChild` may be empty — e.g.
  between ω and ω+1 **there is simply no ordinal at all**, a property of the notation rather than a
  porting mistake. The original moved there unconditionally, blanking out half the screen; now it
  stops at the last valid tick.
- **IndexedDB timeout**: in some environments (private mode, embedded webviews, automation without
  user interaction) IndexedDB stays pending forever, and since start-up is `await restorePlugins()`,
  that means a blank page. A 3-second timeout now falls back to "no user plug-ins".
- **Wheel normalisation**: `deltaY` magnitudes vary wildly across browsers and devices. It is
  converted to pixels and then applied one notch per 100 px, roughly matching one notch in WinForms
  (`e.Delta = ±120`).
- **HiDPI**: the original allocated a bitmap the size of the primary screen and blitted it 1:1 with
  no DPI scaling. The web edition scales the backing store by `devicePixelRatio` and shrinks it back
  via CSS, drawing tick marks at **1 physical pixel** (matching the original's 1 pixel) so they stay
  crisp on high-density displays.

### Layout

Every container size in the original designer file is a placeholder like `120, 0` (lost in
decompilation); only relative hints survive — buttons 51 px, TextBox 48 px, ItemHeight 41. So the
web edition defines its own layout, with row height driven by the CSS variable `--row-h`
(default 43 px).

---

## 8. Known limitations

- **User-uploaded plug-ins only exist in the current browser**: their source lives in IndexedDB, so
  another machine or browser needs a fresh upload. The built-in `Omega2 (w^2)` is unaffected.
- **Old config files import only partially**: colours, alignment mode and the two switches are
  restored; the plug-in exe paths inside cannot be resolved in a browser (no real paths, and exes
  cannot be executed).
- **The ruler has limited room to zoom under the ω² notation**: this system stops at ω², and zooming
  near ω runs into many "no ordinal in between" gaps. To zoom on toward ε₀ or Γ₀ you need a stronger
  notation plug-in.

---

## 9. Source material

The documents this port was based on live in [`docs/`](./docs/README.md) (**in Chinese**):

- [`ONP2-protocol-and-restoration.md`](./docs/ONP2-protocol-and-restoration.md) — official protocol
  text with a line-by-line cross-check against the reverse-engineered code, obfuscated → restored
  identifier map, notes on the two core algorithms, byte-level config format, plug-in checklist
- [`original-vb-project.md`](./docs/original-vb-project.md) — the original desktop project's README

The original VB.NET sources are **not** included here (the web edition is a full TypeScript rewrite).

Credits: 序数界面1 v1.5.4 by the Chinese googology community; ported from
`OrdinalInterface.vb` / `OrdinalInterface.Designer.vb`, which were restored from the decompiled
`Form1.cs`.
