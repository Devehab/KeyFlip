// KeyFlip's Chrome Web Store listing, for copies installed from the store.
// The store gives the extension its ID and adds its update address to the
// installed manifest, so the listing is found without any configuration.
// A copy loaded by hand (developer mode, early-access ZIP) has no store.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KeyFlip = root.KeyFlip || {};
  root.KeyFlip.store = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ID = /^[a-p]{32}$/;

  function detect(manifest, id) {
    const update = (manifest && manifest.update_url) || '';
    if (!ID.test(id || '')) return null;
    if (/^https:\/\/clients2\.google\.com\//.test(update)) {
      return {
        name: 'chrome',
        page: `https://chromewebstore.google.com/detail/${id}`,
        // The store ignores the name part of the path and redirects to the listing.
        review: `https://chromewebstore.google.com/detail/keyflip/${id}/reviews`,
      };
    }
    return null;
  }

  // The running extension's own listing, or null.
  function current() {
    try {
      return detect(chrome.runtime.getManifest(), chrome.runtime.id);
    } catch (e) {
      return null;
    }
  }

  return { detect, current };
});
