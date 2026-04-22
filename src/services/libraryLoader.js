const libraryPromises = new Map();

export function loadExternalLibrary(src, isReady) {
  if (typeof isReady === 'function' && isReady()) return Promise.resolve();
  if (libraryPromises.has(src)) return libraryPromises.get(src);

  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-finance-src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`LOAD_FAILED:${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.financeSrc = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`LOAD_FAILED:${src}`));
    document.head.appendChild(script);
  }).then(() => {
    if (typeof isReady === 'function' && !isReady()) throw new Error(`LIBRARY_NOT_READY:${src}`);
  }).catch((error) => {
    libraryPromises.delete(src);
    throw error;
  });

  libraryPromises.set(src, promise);
  return promise;
}
