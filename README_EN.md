# Ordinal Interface 1 v1.5.4 — Web Edition

> A visual browser for large countable ordinal notations, ported from a
> .NET Framework 4.8 WinForms application to the browser.

The original program comes from the Chinese googology community. Its central design decision is that
**the program itself performs no ordinal arithmetic** — the actual notation system is supplied by an
external "ordinal notation" plug-in, and the two talk over
**ONP2 (Ordinal Notation Protocol 2)**. This web edition keeps that design intact; only the plug-in
form changes, from *console exe + stdin/stdout* to *JS module + synchronous function calls*.

🔗 **Live demo**: `https://tabelog-lg.github.io/ordinal-interface/`
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

Two notations are built in, and expressions are always plain ASCII:

| Notation | Covers | Example expressions |
|---|---|---|
| `Omega2 (w^2)` | below ω², ported line by line from `examples/Omega2Notation/Program.vb` | `0` `5` `w` `w*3` `w*3+7` `Limit` (= ω²) |
| `OmegaOmega (w^w)` | below ω^ω, of the form Σ c[i]·ω^i | `w^2` `w^2*3+w*2+5` `w^3+w` `Limit` (= ω^ω) |

The first entry in the list is the default notation; to change it, reorder the `BUILTINS` array in
`src/engine/plugins.ts`.

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
npm run verify   # logic self-test
npm run bench    # performance benchmark (for before/after comparisons)
```

About 200 assertions covering the five protocol commands, expression parsing/formatting, the `Limit`
and `0` short-circuits, expression validation, ruler initialisation and continuous zooming
(including the out-of-bounds path when zooming all the way out to the top level, and 40 rounds of
zooming back and forth), tree expansion on click (including the bug 1 fix), scrolling, plus a
**cross-check of the binary search against a brute-force linear scan** (45 cases) and cache
capacity limits.

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
│  ├─ omegaOmega.ts       the ω^ω notation (second built-in)
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
tests/
├─ verify.ts               logic self-test (no DOM required)
├─ verify_notations.mjs    notation regression suite (95 assertions: fixes + PPS4 + contract locks)
└─ integration.mjs / integration2.mjs / i3.mjs / check_names.mjs
tools/
└─ crosscheck.py           exe-to-TS cross-check (docs/crosscheck.md)
docs/                      full documentation index: docs/README.md
├─ README.md                       documentation navigation + VB identifier map
├─ CHANGELOG.md                    change log: files touched per round, provenance, exclusions
├─ ONP2-protocol-and-restoration.md / original-vb-project.md
├─ IMPLEMENTATION-NOTES.md        implementation baseline, 2026-11-07/08 fixes, deliberate deviations
├─ crosscheck.md                   cross-check tool: usage, exe map, report reading
├─ reviews/                        11 implementation audit reports + verbatim reference material
├─ pps4-v2-changes/               historical archive of the PPS4 replacement (current: pps4-v2.md)
├─ process-artifacts/             index of workspace temp archives and lost scratch files
└─ restored/                       compilable C++ / C# / VB restorations (not shipped to dist)
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
runnable reference implementation, and the two built-ins `src/engine/omega2.ts` and
`src/engine/omegaOmega.ts` are fuller examples.

**To add another built-in notation** takes two steps: write the implementation under `src/engine/`,
then add one line to the `BUILTINS` array in `src/engine/plugins.ts`
(`{ id: 'builtin:xxx', load: ... }`). List rendering, the "built-in" badge and default selection are
all generic — nothing else needs touching.

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

---

## 8. Performance

A round of targeted optimisation was done during the port. Everything was measured with
`npm run bench` **before** changing anything — and the measurement showed there was really only
one bottleneck: the linear scan in `FirstExceeding`.

### Two algorithmic optimisations

**1. `FirstExceeding`: linear scan → exponential search + binary search (O(n) → O(log n))**

This function finds the first term of a fundamental sequence that exceeds a target. It is the core
of ruler subdivision and runs on every wheel notch. The predicate `a < FS[i]` is monotone in `i`
(fundamental sequences are strictly increasing), so binary search applies:

| Case | Before | After | Speedup |
|---|---|---|---|
| `firstExceeding("w*500","Limit")` ×1000 | 82.17 ms | 4.83 ms | **17×** |
| `firstExceeding("w*5000","Limit")` ×1000 | 1197.60 ms | 7.87 ms | **152×** |

The important part is that it **no longer grows linearly with n** — previously a 10× larger n cost
10× more time; now it is essentially constant. This is also what makes built-in notations as strong
as ε₀ or Γ₀ viable (they would definitely have stalled before).

Two safety nets: the exponential search has a cap (a plug-in whose fundamental sequence is not
increasing trips it after about 20 doublings, instead of grinding through a million queries first),
and after the binary search one extra query verifies that the preceding term does not exceed the
target. **Correctness is cross-checked**: `tests/verify.ts` compares against a brute-force linear
scan on 45 cases — including every power-of-two boundary, where off-by-one bugs hide — and all
agree.

**2. `ValidateExpression` result caching**

An invalid string walks the entire approximation chain (measured at 0.5 ms per call), and clicking
the same button repeatedly in the Misc tab paid that cost every time. With caching, repeated calls
dropped from 982 ms per 2000 to **0.10 ms** (~10,000×).

### Rendering

- **Redraws coalesced through `requestAnimationFrame`**: no matter how many are triggered within a
  frame — wheel spinning, window resizing, dragging a colour picker — only one paint happens.
- **Forced synchronous layout removed**: `getComputedStyle` / `getBoundingClientRect` force the
  browser to compute layout synchronously, and they were being called repeatedly on the per-frame
  paint path and inside the wheel loop (`--row-h` was even queried on every access). Font family and
  row height are now read once at construction, and the mouse coordinate is computed once outside
  the wheel loop.
- **`fillStyle` is only assigned when the colour actually changes**, instead of per row.

### Memory

Every query cache has a **capacity limit** (50,000 entries, evicted FIFO in batches). The ruler can
zoom indefinitely and nodes are created lazily, so new query keys keep appearing — without a cap,
memory would grow without bound. Switching notations clears all caches so results from two
notations cannot bleed into each other.

> Caching deliberately does **not** use LRU: moving a key to the end on a hit costs a `delete` plus
> a `set`, which measured at 0.9 ms → 5.5 ms per 10,000 hits. Plain FIFO makes `get` a single
> `Map.get` with zero overhead; the cost is that hot entries can also be evicted, but they are
> refilled on the next query, which matters far less than a permanent per-hit cost.

## 9. Known limitations

- **User-uploaded plug-ins only exist in the current browser**: their source lives in IndexedDB, so
  another machine or browser needs a fresh upload. The built-in `Omega2 (w^2)` is unaffected.
- **Old config files import only partially**: colours, alignment mode and the two switches are
  restored; the plug-in exe paths inside cannot be resolved in a browser (no real paths, and exes
  cannot be executed).
- **How deep the ruler can zoom depends on the notation itself**: ω² stops at ω², ω^ω stops at ω^ω,
  and zooming near the upper bound runs into many "no ordinal in between" gaps — a property of the
  ordinals, not a bug. Zooming on toward ε₀ or Γ₀ requires a stronger notation plug-in. Note that
  with a stronger notation the linear scan in `FirstExceeding` becomes the bottleneck; see
  "Writing your own notation plug-in".

---

## 10. Documentation

All documents live in [`docs/`](./docs/README.md) (**in Chinese**); `docs/README.md` is the
navigation hub, grouped by purpose:

| Group | Contents | Entry |
|---|---|---|
| Implementation baseline & audits | 11 audit reports, verbatim reference definitions, diff dumps, exe↔TS cross-check summary | [`docs/reviews/README.md`](./docs/reviews/README.md) |
| Fix rationale | what was fixed on 2026-11-07, what was deliberately kept and why, known limits | [`docs/IMPLEMENTATION-NOTES.md`](./docs/IMPLEMENTATION-NOTES.md) |
| Change archive | historical diff of the two PPS4 versions (current implementation: [`pps4-v2.md`](./docs/pps4-v2.md)) | [`docs/pps4-v2-changes/README.md`](./docs/pps4-v2-changes/README.md) |
| Process artifacts | inventory of three temp archives, decompiler slices, files deleted and unrecoverable | [`docs/process-artifacts/README.md`](./docs/process-artifacts/README.md) |
| Port source material | protocol text, original README, VB identifier map, compilable restorations | [`docs/restored/README.md`](./docs/restored/README.md) |
| Cross-check tool | 26 exes vs TS notations, exe map, non-exiting process model, report reading | [`docs/crosscheck.md`](./docs/crosscheck.md) |
| Change log | files touched per round, provenance, excluded process artifacts | [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) |

> **Filename convention**: every filename in this repository is ASCII (including zip entries).
> The only non-ASCII strings are external data — the 26 original exe names inside
> `tools/crosscheck.py` (`EXE_MAP` values), which must be kept verbatim for lookup,
> plus historical source names quoted in the archived audit material.
> See [`tools/README.md`](./tools/README.md) for the old-name → new-name table.

The two primary source documents (ASCII filenames for easy linking):

- [`ONP2-protocol-and-restoration.md`](./docs/ONP2-protocol-and-restoration.md) — official protocol
  text with a line-by-line cross-check against the reverse-engineered code, obfuscated → restored
  identifier map, notes on the two core algorithms, byte-level config format, plug-in checklist
- [`original-vb-project.md`](./docs/original-vb-project.md) — the original desktop project's README

The restored VB.NET sources **are** included in [`docs/restored/vb/`](./docs/restored/vb/),
with the original directory layout intact so the `.vbproj` builds unchanged.

> The audit reports describe the state **before** the 2026-11-07 fixes. Most ❌ verdicts are
> differences between the restored exe's ONP2 output convention and the Googology Wiki
> definitions, not bugs to be fixed. For the current behaviour, read
> `IMPLEMENTATION-NOTES.md` first, then the matching report via `reviews/README.md`.

Credits: 序数界面1 v1.5.4 by the Chinese googology community; ported from
`OrdinalInterface.vb` / `OrdinalInterface.Designer.vb`, which were restored from the decompiled
`Form1.cs`. The 30 restored notations come from user-supplied decompiler output plus the
author's `LELS.cpp` and `Parented BMS.cpp`; see [`docs/reviews/`](./docs/reviews/README.md).
