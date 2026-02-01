/**
 * Waits for all images in print containers to load before resolving.
 * Falls back to a maximum timeout to prevent indefinite waiting.
 */
export const waitForPrintImages = (): Promise<void> => {
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
