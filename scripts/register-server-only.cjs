/**
 * Node register hook so tsx scripts can import Next `server-only` modules.
 * Test/evidence tooling only — does not change production runtime.
 */
const Module = require("module");
const path = require("path");
const orig = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "server-only") {
    return path.join(__dirname, "vitest-server-only-shim.cjs");
  }
  return orig.call(this, request, parent, isMain, options);
};
