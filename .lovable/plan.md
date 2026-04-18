
The user wants the widget embed snippet to always use `pourhub.com.au` instead of the current `window.location.origin` (which gives the lovable.app preview/staging URL when not on the custom domain).

Currently in both `WidgetEmbedSection.tsx` and `WidgetSettings.tsx`:
```ts
const origin = typeof window !== "undefined" ? window.location.origin : "https://pourhub.com.au";
```

This means when a user is viewing the admin from the lovable preview URL, they'll see `https://...lovable.app/widget.js` in the snippet. We want to hard-code the production origin.

The iframe `previewSrc` in `WidgetSettings.tsx` should keep using `window.location.origin` though — because the live preview iframe needs to load from the same origin the user is currently on (otherwise the preview won't work in dev/staging).

## Plan

**Hard-code the public production origin for the embed snippet only.**

### `src/components/settings/WidgetEmbedSection.tsx`
- Replace the `origin` variable with a constant `PUBLIC_ORIGIN = "https://pourhub.com.au"` used in `snippet`.

### `src/pages/admin/WidgetSettings.tsx`
- Add `PUBLIC_ORIGIN = "https://pourhub.com.au"` for the snippet.
- Keep `window.location.origin` for `previewSrc` so the iframe preview keeps working on staging/preview URLs.

No backend, route, or widget.js changes needed — `widget.js` already derives the iframe origin from its own `script.src`, so when a customer pastes the snippet on their site it will correctly load from `pourhub.com.au`.
