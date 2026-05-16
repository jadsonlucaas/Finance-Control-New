const libraryPromises = new Map();
const ALLOWED_EXTERNAL_LIBRARY_HOSTS = new Set([
  'cdnjs.cloudflare.com'
]);

export function isAllowedExternalLibraryUrl(src) {
  try {
    const url = new URL(src, globalThis.document?.baseURI || 'https://finance-control.local/');
    return url.protocol === 'https:' && ALLOWED_EXTERNAL_LIBRARY_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function loadExternalLibrary(src, isReady) {
  if (!isAllowedExternalLibraryUrl(src)) return Promise.reject(new Error(`LIBRARY_NOT_ALLOWED:${src}`));
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
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
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
