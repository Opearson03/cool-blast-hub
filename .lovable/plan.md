

# Fix Print Logo Loading Issue

## Problem

When clicking "Print" on any PDF document (quotes, BOQ, ITP, SWMS), the browser's print interface opens before the company logo has finished loading. This happens because the current implementation uses a fixed 100ms delay which is too short for images to load from the network.

## Solution

Replace the fixed 100ms timeout with a smarter approach that:
1. Waits for the logo image to actually finish loading
2. Falls back to a maximum timeout (1.5 seconds) if the image fails or takes too long

## Technical Approach

Create a reusable helper function that waits for images to load, then update all print handlers to use it.

---

## Files to Modify

| File | Component | Change |
|------|-----------|--------|
| `src/components/estimates/EstimateDetailSheet.tsx` | Quote printing | Update handlePrint to wait for logo |
| `src/components/jobs/boq/BOQCard.tsx` | BOQ printing | Update handlePrint to wait for logo |
| `src/components/jobs/itps/ITPDetailSheet.tsx` | ITP printing | Update handlePrint to wait for logo |
| `src/components/jobs/swms/SWMSDetailSheet.tsx` | SWMS printing | Update handlePrint to wait for logo |

---

## Implementation Details

### New Pattern for handlePrint

```typescript
const handlePrint = () => {
  setIsPrinting(true); // or setShowPrintView(true)
  
  // Wait for images to load before printing
  const waitForImages = () => {
    return new Promise<void>((resolve) => {
      const maxWait = setTimeout(() => resolve(), 1500); // Max 1.5s wait
      
      const images = document.querySelectorAll('.print-container img, .print-estimate-portal img');
      if (images.length === 0) {
        clearTimeout(maxWait);
        resolve();
        return;
      }
      
      let loadedCount = 0;
      const checkAllLoaded = () => {
        loadedCount++;
        if (loadedCount >= images.length) {
          clearTimeout(maxWait);
          resolve();
        }
      };
      
      images.forEach((img) => {
        if ((img as HTMLImageElement).complete) {
          checkAllLoaded();
        } else {
          img.addEventListener('load', checkAllLoaded);
          img.addEventListener('error', checkAllLoaded);
        }
      });
    });
  };
  
  // Small delay to render, then wait for images, then print
  setTimeout(async () => {
    await waitForImages();
    window.print();
    setIsPrinting(false); // or setShowPrintView(false)
  }, 100);
};
```

### Key Benefits

- **Logo always visible**: Print dialog only opens after images have loaded
- **No indefinite waiting**: 1.5 second maximum prevents hanging if images fail
- **Handles all images**: Works with any images in the print view, not just logos
- **Graceful fallback**: If an image fails to load, printing still proceeds

---

## Impact

- All print functionality (Quotes, BOQ, ITP, SWMS) will wait for logos to load
- Maximum additional wait time: 1.5 seconds
- If logo loads quickly, print opens immediately after loading
- If logo fails to load, print still opens after timeout
- No changes to print styling or layout

