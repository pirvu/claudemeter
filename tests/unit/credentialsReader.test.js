import { describe, it, expect } from 'vitest';
const { formatSubscriptionType, formatRateLimitTier } = require('../../src/credentialsReader');

describe('formatSubscriptionType', () => {
    it('capitalises plan name', () => {
        expect(formatSubscriptionType('max')).toBe('Max');
        expect(formatSubscriptionType('pro')).toBe('Pro');
        expect(formatSubscriptionType('free')).toBe('Free');
    });

    it('handles mixed case input', () => {
        expect(formatSubscriptionType('MAX')).toBe('Max');
        expect(formatSubscriptionType('Pro')).toBe('Pro');
    });

    it('returns null for null/undefined', () => {
        expect(formatSubscriptionType(null)).toBeNull();
        expect(formatSubscriptionType(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
        expect(formatSubscriptionType('')).toBeNull();
    });
});

describe('formatRateLimitTier', () => {
    it('formats max 20x tier', () => {
        expect(formatRateLimitTier('default_claude_max_20x')).toBe('Max 20x');
    });

    it('formats max 5x tier', () => {
        expect(formatRateLimitTier('default_claude_max_5x')).toBe('Max 5x');
    });

    it('formats pro tier', () => {
        expect(formatRateLimitTier('default_claude_pro')).toBe('Pro');
    });

    it('formats free tier', () => {
        expect(formatRateLimitTier('default_claude_free')).toBe('Free');
    });

    it('returns raw string for unrecognised format', () => {
        expect(formatRateLimitTier('something_else')).toBe('something_else');
    });

    it('returns null for null/undefined', () => {
        expect(formatRateLimitTier(null)).toBeNull();
        expect(formatRateLimitTier(undefined)).toBeNull();
    });
});
