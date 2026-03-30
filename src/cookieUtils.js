// Project:   Claudemeter
// File:      cookieUtils.js
// Purpose:   Pure cookie utility functions (no vscode dependency)
// Language:  JavaScript (CommonJS)
//
// License:   MIT
// Copyright: (c) 2026 HYPERI PTY LIMITED

// Check whether a stored session cookie has expired.
//
// `expires` is a Unix timestamp in seconds as returned by puppeteer's
// page.cookies() API.  Puppeteer uses -1 (not 0 or undefined) to represent
// session cookies that have no explicit expiry date.  A value of -1 must be
// treated as "never expires" — it is always less than the current timestamp,
// so a naive `expires <= now` guard would incorrectly reject every session
// cookie obtained via the login flow.
//
// Returns true only when the cookie carries a positive, concrete expiry
// timestamp that is in the past.
function isCookieExpired(expires, nowSeconds = Date.now() / 1000) {
    return expires > 0 && expires <= nowSeconds;
}

module.exports = { isCookieExpired };
