/**
 * AI HealthGuard – Risk Band Utility
 * Single source of truth for risk classification logic
 * Zero randomization – deterministic output guaranteed
 */

'use strict';

/**
 * getRiskBand - Maps confidence score to risk band with color coding
 * @param {number} confidence - Confidence score (0-1 or 0-100)
 * @returns {object} { band: string, color: hex, rgb: string }
 */
function getRiskBand(confidence) {
    // Normalize score to 0-1 range if needed (input may be 0-100)
    const score = confidence > 1 ? confidence / 100 : confidence;

    // Round to 2 decimal places for deterministic output
    const normalizedScore = Math.round(score * 100) / 100;

    // Risk band classification (DETERMINISTIC,  NO RANDOMIZATION)
    if (normalizedScore < 0.30) {
        return {
            band: 'Low',
            label: 'Low Risk',
            color: '#10b981',
            rgb: 'rgb(16, 185, 129)',
            bgClass: 'bg-green-900',
            textClass: 'text-green-100',
            badgeClass: 'badge-low',
            severity: 1
        };
    }
    if (normalizedScore < 0.60) {
        return {
            band: 'Medium',
            label: 'Medium Risk',
            color: '#f59e0b',
            rgb: 'rgb(245, 158, 11)',
            bgClass: 'bg-yellow-900',
            textClass: 'text-yellow-100',
            badgeClass: 'badge-medium',
            severity: 2
        };
    }
    if (normalizedScore < 0.80) {
        return {
            band: 'High',
            label: 'High Risk',
            color: '#f97316',
            rgb: 'rgb(249, 115, 22)',
            bgClass: 'bg-orange-900',
            textClass: 'text-orange-100',
            badgeClass: 'badge-high',
            severity: 3
        };
    }

    // >= 0.80
    return {
        band: 'Critical',
        label: 'Critical Risk',
        color: '#ef4444',
        rgb: 'rgb(239, 68, 68)',
        bgClass: 'bg-red-900',
        textClass: 'text-red-100',
        badgeClass: 'badge-critical',
        severity: 4
    };
}

/**
 * Test: getRiskBand must be deterministic
 * Same input → same output, every time
 */
function testRiskBandDeterminism() {
    const testCases = [
        { input: 0.25, expected: 'Low' },
        { input: 0.45, expected: 'Medium' },
        { input: 0.75, expected: 'High' },
        { input: 0.85, expected: 'Critical' },
        { input: 25, expected: 'Low' },     // 0-100 scale
        { input: 45, expected: 'Medium' },  // 0-100 scale
        { input: 75, expected: 'High' },    // 0-100 scale
        { input: 85, expected: 'Critical' } // 0-100 scale
    ];

    const results = testCases.map(tc => {
        const band = getRiskBand(tc.input);
        const pass = band.band === tc.expected;
        const result1 = getRiskBand(tc.input).band;
        const result2 = getRiskBand(tc.input).band;
        const deterministic = result1 === result2;

        return {
            input: tc.input,
            expectedBand: tc.expected,
            actualBand: band.band,
            pass,
            deterministic,
            log: `Input: ${tc.input} → Band: ${band.band} (${band.label}) [${pass ? 'PASS' : 'FAIL'}]`
        };
    });

    return {
        allPass: results.every(r => r.pass && r.deterministic),
        results,
        summary: `${results.filter(r => r.pass).length}/${results.length} tests passed. All deterministic: ${results.every(r => r.deterministic)}`
    };
}

// Auto-run test on load (dev only)
if (typeof window !== 'undefined' && window.DEBUG) {
    console.log('[getRiskBand] Running determinism tests...');
    const testResults = testRiskBandDeterminism();
    console.log(testResults);
}
