/**
 * PDF.js Worker Configuration
 * 
 * This module configures the PDF.js worker to use the bundled ES module worker
 * from the same origin, avoiding CDN/CORS issues and module format mismatches.
 * 
 * Import this module once at app startup (main.tsx) before any PDF rendering.
 */

import * as pdfjs from 'pdfjs-dist';

// Import the worker as a URL using Vite's ?url suffix
// This bundles the worker file and returns its URL
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure PDF.js to use the bundled worker
// Setting workerSrc is the standard approach for pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// Export pdfjs for convenience - components can import from here
export { pdfjs };
