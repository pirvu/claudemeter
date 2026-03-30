import { describe, it, expect } from 'vitest';
const { isCookieExpired } = require('../../src/cookieUtils');

describe('isCookieExpired', () => {
    const PAST = 1_000_000;          // well in the past (seconds)
    const FUTURE = 9_999_999_999;    // far in the future (seconds)

    it('returns false for a session cookie (expires = -1)', () => {
        expect(isCookieExpired(-1)).toBe(false);
    });

    it('returns false when expires is 0', () => {
        expect(isCookieExpired(0)).toBe(false);
    });

    it('returns false when expires is null', () => {
        expect(isCookieExpired(null)).toBe(false);
    });

    it('returns false when expires is undefined', () => {
        expect(isCookieExpired(undefined)).toBe(false);
    });

    it('returns true for a cookie that expired in the past', () => {
        expect(isCookieExpired(PAST)).toBe(true);
    });

    it('returns false for a cookie that expires in the future', () => {
        expect(isCookieExpired(FUTURE)).toBe(false);
    });

    it('accepts an explicit nowSeconds argument', () => {
        const ref = 1_700_000_000;
        expect(isCookieExpired(ref - 1, ref)).toBe(true);   // just expired
        expect(isCookieExpired(ref + 1, ref)).toBe(false);  // not yet expired
        expect(isCookieExpired(ref, ref)).toBe(true);       // expires exactly now
    });
});
