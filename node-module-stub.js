// Stub for Node.js-only built-in modules when bundled for the browser.
// satellite.js's WASM pthreads runtime conditionally imports node:module
// and node:worker_threads behind an environment detection guard, so these
// are never actually called in a browser context.
module.exports = {};
