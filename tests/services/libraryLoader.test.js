import { describe, expect, it } from 'vitest';
import { isAllowedExternalLibraryUrl } from '../../src/services/libraryLoader.js';

describe('external library loader allowlist', () => {
  it('allows the approved CDN over HTTPS', () => {
    expect(isAllowedExternalLibraryUrl('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js')).toBe(true);
  });

  it('blocks non-HTTPS and unknown hosts', () => {
    expect(isAllowedExternalLibraryUrl('http://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js')).toBe(false);
    expect(isAllowedExternalLibraryUrl('https://example.com/script.js')).toBe(false);
    expect(isAllowedExternalLibraryUrl('javascript:alert(1)')).toBe(false);
  });
});
