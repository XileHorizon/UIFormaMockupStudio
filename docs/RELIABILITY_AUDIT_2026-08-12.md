# UIForma reliability audit

Date: 2026-08-12  
Repositories:

- `UISystemGenerator` at baseline `7cf6780`
- `UIFormaMockupStudio` at baseline `db54424`

This audit is intentionally limited to correctness, data safety, accessibility behavior, portability, performance, and automated coverage. It does not propose a UI redesign.

## Completed during this audit

### UIFormaMockupStudio

- Fixed the iPhone screenshot being rendered as a small lower-left tile. Browser captures proved that `RoundedBox` extrude UVs did not map the screenshot across the display. The screen now uses a UV-normalized plane with a rounded alpha mask derived from the measured display geometry.
- Made WebGL visual captures deterministic by clipping a page screenshot to the canvas bounds instead of waiting for a continuously rendered element to become stable.
- Added a pixel-coverage assertion for the front-facing iPhone scene. The original defect fails this assertion; the corrected screen passes it.
- Repaired the interaction QA against the current export scale control and verified transform editing, duplicate/delete shortcuts, transparent PNG, and WebP output.
- Disposed placeholder and replacement screen textures when inputs change or components unmount.
- Added dialog semantics and accessible names/state to the export controls exercised by browser QA.

### UISystemGenerator

- Made startup recovery tolerate browsers where `localStorage` reads and writes both throw.
- Prevented the no-`CompressionStream` fallback from creating raw share links larger than the decoder's 256 KiB input limit.

## Prioritized remaining backlog

### P0 — UIFormaMockupStudio data durability and untrusted project input

1. Add explicit autosave with visible `Saving`, `Saved`, and recoverable failure states.
   - Evidence: `EditorProvider` always initializes `useReducer` from `initialState`; there is no storage read or write (`src/store.tsx:513-515`). A reload loses all work unless the user manually exports JSON.
   - Required coverage: debounced save/reload, quota/security failures, recovery export, and `beforeunload` behavior.

2. Define and enforce one bounded runtime schema for JSON imports and hash shares.
   - Evidence: file import accepts any parsed value with an `objects` array (`src/components/TopToolbar.tsx:59-74`); hash decode casts parsed JSON directly to `AppState` (`src/store.tsx:501-508`); the reducer spreads the payload over the complete state while only shallowly filtering objects (`src/store.tsx:346-347`). Missing `background` or `lighting` can then be dereferenced by the canvas (`src/components/Canvas3D.tsx:295-305`).
   - Add byte, object-count, string, numeric-range, nesting, and decoded-hash limits before parsing/evaluation.
   - Required coverage: malformed/missing state, invalid device types, non-finite transforms, hostile layout modifiers, duplicate IDs, and oversized inputs.

### P1 — UIFormaMockupStudio portability and accessibility behavior

3. Make media/project exports truthful and portable.
   - Evidence: video uploads are stored as session-only `blob:` URLs (`src/components/LeftSidebar.tsx:155-158`), while JSON export serializes the state unchanged (`src/components/TopToolbar.tsx:85-93`). Imported files cannot restore those URLs after the originating page closes.
   - Revoke replaced video object URLs, warn before omitting media, and use a bounded bundle format if embedded video portability is required.
   - Share currently drops screenshots over 50,000 characters without a user-visible warning (`src/store.tsx:481-490`) and has no encoded/decompressed size gate.

4. Establish an accessibility gate for the editor, not just export controls.
   - Evidence: the object row is pointer-only, range controls in `RightSidebar`, `LeftSidebar`, and `AutoLayoutPanel` have no programmatic names, and the canvas has no keyboard-equivalent scene interaction. The repository has no axe/browser accessibility test suite.
   - Add keyboard-selectable scene rows, named inputs, visible focus, modal focus management/Escape behavior, and automated axe plus keyboard tests at desktop, narrow viewport, and 200% zoom.

5. Make browser QA portable and release-blocking.
   - Evidence: `scripts/visual-qa.mjs` and `scripts/interaction-qa.mjs` use absolute OpenClaw Playwright/Chromium paths, are absent from `package.json` scripts, and are not run by CI.
   - Add a repository-owned Playwright dependency/configuration, stable checked-in baselines or explicit image assertions, console/network failure policy, and package/CI scripts.
   - Extend coverage beyond the front iPhone to screen fill/cropping for every device, selected/unselected states, multiple-device compositions, transparent export, and model-load failures.

### P1 — UISystemGenerator coverage gates

6. Repair the checked-in visual baselines before treating `npm run check` as green.
   - Evidence: all four Playwright visual tests currently receive a 27 px taller iframe than the checked-in snapshots (expected 682 px, received 709 px); the other 39 browser tests pass. The current images look structurally consistent, so stabilize the preview capture dimensions and then review/rebaseline deliberately.

7. Audit the preview documents themselves with axe.
   - Evidence: the shared helper excludes every `iframe` (`tests/accessibility.spec.ts:19-26`), but the generated-documentation and live-preview tests invoke that helper on the outer page (`tests/accessibility.spec.ts:66-98`). Their names currently overstate what is scanned.
   - Run axe inside each same-origin `srcdoc` frame and keep a separate shell audit. Revisit the blanket `color-contrast` disablement for the editor chrome.

8. Restore the formatting gate.
   - Evidence: `oxfmt --check .` reports existing changes needed in `landing/index.html`, `landing/script.js`, `landing/styles.css`, and `src/paletteExportContract.test.ts`, so `npm run check` exits before typecheck/tests/build.

### P2 — GPU, memory, and bundle performance

9. Add repeatable GPU/memory budgets for UIFormaMockupStudio.
   - Evidence: the canvas continuously renders at DPR 2 with a 2048 shadow map and `preserveDrawingBuffer` enabled (`src/components/Canvas3D.tsx:237-248`, `326-336`). The production build emits a 1,406.72 kB minified main chunk and Vite's >500 kB warning.
   - Measure idle frame work, interaction frame time, WebGL texture/geometry counts, context loss, and peak export memory on representative 1/8/24-object scenes. Then decide whether on-demand rendering, adaptive DPR, capture-only framebuffer preservation, or code splitting is warranted.

10. Share or cache identical screen textures across generated copies.
    - Evidence: every device hook creates its own 1400×900 placeholder and uploaded images are copied into a per-instance canvas with a 2048 px long edge (`src/components/StudioMonitor3D.tsx:59-119`). Disposal is now correct, but linked clones still duplicate GPU textures.

11. Keep UISystemGenerator's accepted bundle budget visible.
    - Evidence: the local build passes its explicit budgets (6,556,840 B JS; 1,670,687 B gzip; 219,993 B CSS) but Vite still warns for chunks over 500 kB. This is not a current release failure; future work should focus on initial-load/interaction measurements rather than generic chunk size alone.

### P2 — Missing correctness tests

12. UIFormaMockupStudio currently has only two unit tests, both for iPhone geometry. Add reducer/layout tests for group rotation, linked layouts, selection/reordering, import normalization, media replacement cleanup, and deterministic template/project round trips. Add browser failure-path tests for image decode failure, WebGL/model load failure, export failure, and clipboard denial.

13. UISystemGenerator should add failure-path coverage for browsers that can decode neither compressed links nor clipboard writes, and should document/test the intentional limitation that imported project files must match the current schema even though browser-storage migrations cover v1-v17.

## Blockers and accepted warnings

- No deployment, push, publication, or external message was performed.
- UISystemGenerator's complete `npm run check` is blocked by the four existing formatting failures and four stale/drifting visual baselines described above.
- Both production builds emit Vite's generic >500 kB chunk warning. UISystemGenerator remains within its explicit budgets; UIFormaMockupStudio has no explicit budget yet.
- UIFormaMockupStudio browser captures report Three.js deprecations for `THREE.Clock` and `PCFSoftShadowMap`, plus a local analytics request aborted during development. The interaction QA itself reports no console/page/HTTP issues.
- Git reports that the configured LFS post-commit hook cannot find `git-lfs`; commits still complete successfully.
