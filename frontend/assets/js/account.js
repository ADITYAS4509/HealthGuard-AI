/**
 * AI HealthGuard – account.js
 * My Account page logic: profile, PDF download (F4/F5), Share with Doctor (F6)
 */
document.addEventListener("DOMContentLoaded", () => {
    const BACKEND_URL = window.VITE_API_URL || '';
    const API_BASE = BACKEND_URL + '/auth';

    // ── Auth Check ────────────────────────────────────────────────────────────
    const sessionStr = localStorage.getItem('hg_user_session');
    if (!sessionStr) { window.location.href = 'login.html'; return; }

    const sessionUser = JSON.parse(sessionStr);
    if (sessionUser?.data?.is_guest) { window.location.href = 'index.html'; return; }

    const userData = sessionUser.data;

    // ── Populate Profile ──────────────────────────────────────────────────────
    document.getElementById('accName').innerText = userData.username || 'Authorized User';
    document.getElementById('accUsername').innerText = `@${userData.username || 'user'}`;
    document.getElementById('accEmail').innerText = userData.email || 'Protected';

    // ── Toast Utility ─────────────────────────────────────────────────────────
    function showToast(msg, type = 'info') {
        const n = document.getElementById('notification');
        const m = document.getElementById('notifMsg');
        if (!n || !m) return;
        m.textContent = msg;
        n.classList.add('show');
        setTimeout(() => n.classList.remove('show'), 5000);
    }

    // ── Shared Data Reader ────────────────────────────────────────────────────
    function readAnalysis() {
        const raw = localStorage.getItem('hg_last_analysis');
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (_) { return null; }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    function fmt(isoStr) {
        if (!isoStr) return 'Not recorded';
        try { return new Date(isoStr).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }); }
        catch (_) { return isoStr; }
    }

    function cap(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : '—'; }

    function severityLabel(n) {
        return ['', 'Very Mild', 'Mild', 'Moderate', 'Severe', 'Critical'][+n] || 'Moderate';
    }

    /** Short pseudo-session ID derived from timestamp (no sensitive data) */
    function sessionId(isoStr) {
        if (!isoStr) return 'N/A';
        const ts = new Date(isoStr).getTime();
        return `HG-${(ts % 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0')}`;
    }

    // ── Feature 4 + 5: Build Clinical-Grade PDF HTML ─────────────────────────
    function buildPdfHtml(d) {
        const riskColor = { low: '#16a34a', medium: '#ca8a04', high: '#dc2626', critical: '#7c3aed' };
        const rColor = riskColor[(d.risk || 'low').toLowerCase()] || '#333';

        // Symptoms
        const sympHtml = (d.symptoms && d.symptoms.length)
            ? `<ul class="pdf-list">${d.symptoms.map(s => `<li>${s}</li>`).join('')}</ul>`
            : '<p class="pdf-na">No symptoms recorded.</p>';

        // Medicines (OTC)
        let medHtml = '<p class="pdf-na">No medicine guidance available for this assessment.</p>';
        if (d.medicines && d.medicines.length) {
            medHtml = `
<p class="pdf-note">General guidance only — OTC suggestions based on reported symptoms and age group.</p>
<table class="pdf-table">
  <thead><tr><th>Medicine</th><th>Purpose</th><th>Dosage (Adult)</th></tr></thead>
  <tbody>
    ${d.medicines.map(m => `<tr>
      <td><strong>${m.name || '—'}</strong></td>
      <td>${m.purpose || '—'}</td>
      <td>${m.dosage || m.adult || '—'}</td>
    </tr>`).join('')}
  </tbody>
</table>`;
        }

        // Hospitals (only if critical or data present)
        let hospHtml = '<p class="pdf-na">Hospital guidance not required for this risk level.</p>';
        if (d.hospitals && d.hospitals.length) {
            hospHtml = `
<p class="pdf-note">Nearest facilities identified during assessment. Verify availability before visiting.</p>
<ul class="pdf-list">
${d.hospitals.map(h => {
                const name = typeof h === 'string' ? h : (h.name || 'Unnamed Hospital');
                const dist = (typeof h === 'object' && h.distance) ? ` &mdash; ${h.distance}` : '';
                const addr = (typeof h === 'object' && h.address) ? `<br><small style="color:#666">${h.address}</small>` : '';
                return `<li>${name}${dist}${addr}</li>`;
            }).join('')}
</ul>`;
            if ((d.risk || '').toLowerCase() === 'critical') {
                hospHtml += `<p class="pdf-emergency"><strong>CRITICAL:</strong> Proceed to the nearest emergency department immediately. Call 112 if ambulance is required.</p>`;
            }
        }

        // Confidence
        const confStr = (d.confidence !== null && d.confidence !== undefined)
            ? `${Math.round(d.confidence * 100)}%` : 'Not available';

        const sid = sessionId(d.savedAt);

        return `
<!-- WATERMARK (Feature 5) -->
<div class="pdf-watermark">AI HealthGuard &ndash; Demo Use Only</div>

<!-- HEADER -->
<div class="pdf-header">
    <div class="pdf-appname">AI HealthGuard</div>
    <div class="pdf-title">Clinical Assessment Summary</div>
    <div class="pdf-datetime">${fmt(d.savedAt)}</div>
</div>

<hr class="pdf-rule">

<!-- SECTION 1: Patient / Session Info -->
<h2 class="pdf-section-title">Patient &amp; Session Information</h2>
<table class="pdf-info-table">
  <tr><td class="pdf-label">Name</td><td>${d.userName || 'Guest User'}</td></tr>
  <tr><td class="pdf-label">Age</td><td>${d.age ? `${d.age} years` : 'Not specified'}</td></tr>
  <tr><td class="pdf-label">Location</td><td>${d.city || 'Not specified'}</td></tr>
  <tr><td class="pdf-label">Session ID</td><td>${sid}</td></tr>
  <tr><td class="pdf-label">Mode</td><td>${d.isLoggedIn ? 'Logged-in' : 'Guest'}</td></tr>
</table>

<!-- SECTION 2: Symptoms -->
<h2 class="pdf-section-title">Reported Symptoms &amp; Duration</h2>
${sympHtml}
<p><strong>Duration:</strong> ${d.duration ? `${d.duration} day${d.duration !== 1 ? 's' : ''}` : 'Not specified'} &nbsp;&nbsp;
   <strong>Severity (self-reported):</strong> ${severityLabel(d.severity)}</p>

<!-- SECTION 3: Assessment Result -->
<h2 class="pdf-section-title">Assessment Result</h2>
<table class="pdf-info-table">
  <tr><td class="pdf-label">Predicted Condition</td><td><strong>${d.condition || 'Not determined'}</strong></td></tr>
  <tr><td class="pdf-label">Confidence</td><td>${confStr}</td></tr>
  <tr>
    <td class="pdf-label">Risk Level</td>
    <td><span class="pdf-risk-badge" style="border-color:${rColor};color:${rColor}">${cap(d.risk || 'unknown')}</span></td>
  </tr>
  <tr><td class="pdf-label">Risk Score</td><td>${d.score !== undefined ? `${d.score} / 100` : 'N/A'}</td></tr>
</table>

<!-- SECTION 4: Clinical Explanation -->
<h2 class="pdf-section-title">Clinical Explanation</h2>
<p class="pdf-explanation">${d.explanation || 'No clinical context available for this assessment.'}</p>

<!-- SECTION 5: Medicine Guidance -->
<h2 class="pdf-section-title">Medicine Guidance (OTC Only)</h2>
${medHtml}

<!-- SECTION 6: Hospital Guidance -->
<h2 class="pdf-section-title">Hospital Guidance</h2>
${hospHtml}

<!-- DISCLAIMER (Feature 4 Mandatory) -->
<div class="pdf-disclaimer">
    <strong>Disclaimer:</strong> This document is generated for informational purposes only and does not replace
    professional medical advice, diagnosis, or treatment. AI HealthGuard is a decision-support tool.
    Always consult a qualified healthcare professional before acting on this information.
    Insurance eligibility, claim approval, and medical outcomes depend on individual circumstances.
</div>

<!-- FOOTER / VERSION (Feature 5) -->
<div class="pdf-footer">
    Report Version: v1.0 &nbsp;|&nbsp; Generated by AI HealthGuard &nbsp;|&nbsp; ${fmt(d.savedAt)}
</div>
`;
    }

    // ── Feature 4 + 5: Download PDF ───────────────────────────────────────────
    document.getElementById('btnDownloadPDF').addEventListener('click', () => {
        const d = readAnalysis();
        if (!d) {
            showToast('No assessment found. Please run a health analysis on the main page first.');
            return;
        }
        document.getElementById('pdfReport').innerHTML = buildPdfHtml(d);
        window.print();
    });

    // ── Feature 6: Share With Doctor ─────────────────────────────────────────
    const shareModal = document.getElementById('shareModal');
    const modalOverlay = document.getElementById('modalOverlay');

    function openModal() {
        const d = readAnalysis();
        if (!d) {
            showToast('No assessment found. Please run a health analysis on the main page first.');
            return;
        }
        // Populate the copy-text summary
        const summary = [
            'AI HealthGuard – Clinical Assessment Summary',
            '─'.repeat(44),
            `Patient: ${d.userName || 'Guest User'}`,
            `Date: ${fmt(d.savedAt)}`,
            ``,
            `Condition: ${d.condition || 'Not determined'}`,
            `Risk Level: ${cap(d.risk || 'unknown')}`,
            `Confidence: ${d.confidence !== null && d.confidence !== undefined ? Math.round(d.confidence * 100) + '%' : 'N/A'}`,
            ``,
            `Symptoms: ${(d.symptoms || []).join(', ') || 'None recorded'}`,
            ``,
            `Clinical Context:`,
            d.explanation || 'Not available.',
            ``,
            '─'.repeat(44),
            'DISCLAIMER: This summary is for informational purposes only.',
            'It does not constitute a medical diagnosis. Consult your doctor.',
        ].join('\n');

        document.getElementById('shareSummaryText').value = summary;
        shareModal.style.display = 'flex';
        modalOverlay.style.display = 'block';
    }

    function closeModal() {
        shareModal.style.display = 'none';
        modalOverlay.style.display = 'none';
    }

    document.getElementById('btnShareDoctor').addEventListener('click', openModal);
    document.getElementById('modalOverlay').addEventListener('click', closeModal);
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);

    // Option 1: Download PDF from modal
    document.getElementById('btnShareDownloadPDF').addEventListener('click', () => {
        closeModal();
        const d = readAnalysis();
        if (!d) return;
        document.getElementById('pdfReport').innerHTML = buildPdfHtml(d);
        window.print();
    });

    // Option 2: Copy secure summary text
    document.getElementById('btnCopySummary').addEventListener('click', () => {
        const ta = document.getElementById('shareSummaryText');
        navigator.clipboard.writeText(ta.value)
            .then(() => showToast('Summary copied to clipboard.'))
            .catch(() => {
                ta.select();
                document.execCommand('copy');
                showToast('Summary copied to clipboard.');
            });
    });

    // Option 3: Open email client (no backend, no attachment)
    document.getElementById('btnEmailDoctor').addEventListener('click', () => {
        const ta = document.getElementById('shareSummaryText');
        const subject = encodeURIComponent('AI HealthGuard – Clinical Assessment Summary');
        const body = encodeURIComponent(ta.value);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    });

    // ── Logout ────────────────────────────────────────────────────────────────
    const btnLogout = document.getElementById('btnLogoutMain');

    async function logout() {
        try { await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' }); } catch (_) { }
        localStorage.removeItem('hg_user_session');
        window.location.href = 'login.html';
    }

    btnLogout.addEventListener('click', () => {
        btnLogout.disabled = true;
        btnLogout.innerText = 'Logging out...';
        logout();
    });
});
