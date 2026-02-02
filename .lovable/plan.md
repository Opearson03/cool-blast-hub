
## Diagnosis (what’s happening and why)
You’re still seeing:

> Setting up fake worker failed: “Failed to fetch dynamically imported module: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js?import”

This error means PDF.js is failing to start its Web Worker, then falling back to a “fake worker” (running worker code on the main thread). That fallback uses a dynamic `import()` to load the worker file.

### Why it fails in our current setup
Right now both of these files configure PDF.js with a CDN worker URL that points to `pdf.worker.min.js`:

- `src/components/estimates/takeoff/PlanViewer.tsx`
- `src/components/contacts/InboxDetailSheet.tsx`

In PDF.js v4, the worker is expected to be an ES module worker (`.mjs` / module format). The CDN `pdf.worker.min.js` build is not the right module format for that `import()` path. So when PDF.js tries to dynamically import it, it fails, producing the exact `...?import` error.

Additionally, depending on environment (preview iframe, native shell, etc.), cross-origin + dynamic module import is more fragile than serving the worker from the same origin.

## Fix strategy
Stop loading the worker from a CDN and instead bundle/serve the worker from our app build (same origin), using the official PDF.js worker module (`pdf.worker.mjs`) and initializing it as a **module worker**.

This avoids:
- CORS/dynamic import edge cases
- “wrong worker format” mismatch (`.js` vs `.mjs`)
- reliance on an external CDN

## Implementation Plan
### 1) Create a single “configure PDF.js worker” utility
Add a new helper module (example path):
- `src/lib/pdfjsWorker.ts`

Responsibilities:
- Import PDF.js once
- Import the worker asset URL from `pdfjs-dist/build/pdf.worker.mjs?url`
- Configure PDF.js to use a module worker, ideally via `GlobalWorkerOptions.workerPort` (most robust for v4)

Proposed logic (high level):
- If `window.Worker` exists and worker isn’t already set:
  - `const workerUrl = (imported ?url string)`
  - `GlobalWorkerOptions.workerPort = new Worker(workerUrl, { type: 'module' })`
- Optionally also set `GlobalWorkerOptions.workerSrc = workerUrl` as a fallback (but `workerPort` should take precedence)

Why `workerPort`:
- PDF.js itself ships a `webpack.mjs` helper that uses this exact pattern internally:
  - `GlobalWorkerOptions.workerPort = new Worker(new URL("./build/pdf.worker.mjs", import.meta.url), { type: "module" })`
- We’ll replicate that approach in a Vite-friendly way.

### 2) Remove all CDN-based worker configuration
Update both files to stop doing this:
- `pdfjs.GlobalWorkerOptions.workerSrc = https://cdnjs.../pdf.worker.min.js`
- `pdfjsLib.GlobalWorkerOptions.workerSrc = //cdnjs.../pdf.worker.min.js`

Specifically:
- `src/components/estimates/takeoff/PlanViewer.tsx`
- `src/components/contacts/InboxDetailSheet.tsx`

Replace with:
- `import "@/lib/pdfjsWorker"` (or import a function and call it)
so the worker is configured consistently everywhere.

### 3) Ensure configuration runs early enough
Two safe options:
- Import the worker config module at the top of each PDF-using component (PlanViewer + InboxDetailSheet), OR
- Import it once globally in `src/main.tsx` so it’s always configured before any PDF rendering occurs.

Preferred: import once in `main.tsx` (reduces risk of multiple Worker instances and prevents order-of-import issues).

### 4) Verify the fix in both areas that use PDF.js
Test flows:
1. Admin → Estimates → Takeoff viewer
   - Confirm the PDF loads
   - Confirm no “Setting up fake worker failed” errors in console
2. Contacts → Inbox → open an email with a PDF attachment
   - Confirm PDF preview loads
   - Confirm page navigation still works

### 5) Add a fallback if a specific device/browser still can’t run module workers
If some older environments still fail (e.g., older iOS WebView), we’ll implement a controlled fallback:
- Switch to the PDF.js legacy build worker import (`pdfjs-dist/legacy/build/pdf.worker.mjs?url`) in the worker config file when module workers aren’t supported.
- If even that fails, show a clear UI message with a single “Open PDF in new tab” action (so users can still access the document).

## Files involved (expected changes)
- Add: `src/lib/pdfjsWorker.ts` (new)
- Edit: `src/main.tsx` (import the worker config once)
- Edit: `src/components/estimates/takeoff/PlanViewer.tsx` (remove CDN worker config, rely on shared config)
- Edit: `src/components/contacts/InboxDetailSheet.tsx` (remove CDN worker config, rely on shared config)

## Why this will fix your exact error
- The failing URL ends with `pdf.worker.min.js?import` — that’s the fake-worker dynamic import path trying to import a non-module worker build.
- By bundling and initializing the correct module worker (`pdf.worker.mjs`) from the app origin, PDF.js won’t need the fake-worker import path, and the worker will start reliably.

## Acceptance criteria (what “done” looks like)
- Takeoff PDFs render without the “PDF NOT VIEWABLE” screen.
- Console no longer shows “Setting up fake worker failed…”
- Inbox PDF previews still work (or improve), using the same worker configuration.
