document.addEventListener("DOMContentLoaded", () => {
    // Shared Utils
    // Shared Utils
    const BACKEND_URL = window.VITE_API_URL || '';
    const API_BASE = BACKEND_URL + '/auth';
    const notifMsg = document.getElementById('notifMsg');
    const notifIcon = document.getElementById('notifIcon');
    const notification = document.getElementById('notification');

    function showNotif(msg, type = 'info') {
        notifMsg.innerText = msg;
        notifIcon.innerText = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        notification.style.background = type === 'error' ? 'var(--clr-critical)' : 'var(--clr-accent)';
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }

    async function safeFetch(url, options = {}) {
        options.credentials = 'include';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        options.signal = controller.signal;

        try {
            const res = await fetch(url, options);
            clearTimeout(timeoutId);
            let data = {};
            try { data = await res.json(); } catch (e) { }
            return { ok: res.ok, status: res.status, data };
        } catch (err) {
            clearTimeout(timeoutId);
            console.debug('[HG] Network request failed:', url, err);
            return {
                ok: false,
                status: 0,
                data: { success: false, error: err.name === 'AbortError' ? 'Request timed out.' : 'Service is temporarily unavailable.' },
                networkError: true
            };
        }
    }

    const elements = {
        landingView: 'landingView',
        authCard: 'authCard',
        btnContinueLogin: 'btnContinueLogin',
        btnContinueGuest: 'btnContinueGuest',
        backToLanding: 'backToLanding',
        authLoginForm: 'authLoginForm',
        authRegisterForm: 'authRegisterForm',
        authForgotForm: 'authForgotForm',
        loginForm: 'loginForm',
        registerForm: 'registerForm',
        registerOtpForm: 'registerOtpForm',
        forgotPassRequestForm: 'forgotPassRequestForm',
        forgotPassResetForm: 'forgotPassResetForm',
        tabLogin: 'tabLogin',
        tabRegister: 'tabRegister',
        linkForgotPass: 'linkForgotPass',
        backToRegInfo: 'backToRegInfo'
    };

    const el = {};
    for (const [key, id] of Object.entries(elements)) {
        el[key] = document.getElementById(id);
        if (!el[key]) console.warn(`[HG] Warning: Element #${id} not found.`);
    }

    const backToLoginLinks = document.querySelectorAll('.back-to-login-link');

    // --- VIEW / TAB SWITCHING ---
    function showAuthView(tab = 'login') {
        console.log("[HG] showAuthView:", tab);
        if (el.landingView) el.landingView.style.display = 'none';
        if (el.authCard) el.authCard.style.display = 'block';
        switchTab(tab);
    }

    function showLandingView() {
        console.log("[HG] showLandingView");
        if (el.authCard) el.authCard.style.display = 'none';
        if (el.landingView) el.landingView.style.display = 'block';
    }

    function switchTab(target) {
        console.log("[HG] switchTab to:", target);

        // Hide all forms first
        const forms = ['authLoginForm', 'authRegisterForm', 'authForgotForm'];
        forms.forEach(id => {
            const f = document.getElementById(id);
            if (f) f.style.display = 'none';
        });

        // Tab buttons
        const tabLogin = document.getElementById('tabLogin');
        const tabRegister = document.getElementById('tabRegister');

        if (target === 'login') {
            const f = document.getElementById('authLoginForm');
            if (f) f.style.display = 'block';
            if (tabLogin) {
                tabLogin.classList.add('active');
                tabLogin.style.color = 'var(--clr-accent)';
            }
            if (tabRegister) {
                tabRegister.classList.remove('active');
                tabRegister.style.color = 'var(--clr-text-muted)';
            }
        } else if (target === 'register') {
            const f = document.getElementById('authRegisterForm');
            if (f) f.style.display = 'block';

            const rf = document.getElementById('registerForm');
            if (rf) rf.style.display = 'block';

            const rof = document.getElementById('registerOtpForm');
            if (rof) rof.style.display = 'none';

            if (tabRegister) {
                tabRegister.classList.add('active');
                tabRegister.style.color = 'var(--clr-accent)';
            }
            if (tabLogin) {
                tabLogin.classList.remove('active');
                tabLogin.style.color = 'var(--clr-text-muted)';
            }
        } else if (target === 'forgot') {
            const f = document.getElementById('authForgotForm');
            if (f) f.style.display = 'block';

            const reqF = document.getElementById('forgotPassRequestForm');
            if (reqF) reqF.style.display = 'block';

            const resetF = document.getElementById('forgotPassResetForm');
            if (resetF) resetF.style.display = 'none';
        }
    }

    if (el.btnContinueLogin) el.btnContinueLogin.addEventListener('click', () => showAuthView('login'));
    if (el.btnContinueGuest) el.btnContinueGuest.addEventListener('click', () => {
        const guestSession = { success: true, data: { is_guest: true, full_name: 'Guest User', username: 'guest' } };
        localStorage.setItem('hg_user_session', JSON.stringify(guestSession));

        window.location.href = 'index.html';
    });
    if (el.backToLanding) el.backToLanding.addEventListener('click', showLandingView);

    if (el.tabLogin) el.tabLogin.addEventListener('click', () => switchTab('login'));
    if (el.tabRegister) el.tabRegister.addEventListener('click', () => { console.log("[HG] Tab Register clicked"); switchTab('register'); });
    if (el.linkForgotPass) el.linkForgotPass.addEventListener('click', (e) => { e.preventDefault(); switchTab('forgot'); });
    if (el.backToRegInfo) el.backToRegInfo.addEventListener('click', (e) => {
        e.preventDefault();
        if (el.registerOtpForm) el.registerOtpForm.style.display = 'none';
        if (el.registerForm) el.registerForm.style.display = 'block';
    });
    backToLoginLinks.forEach(l => l.addEventListener('click', (e) => { e.preventDefault(); switchTab('login'); }));

    // --- PASSWORD STRENGTH ENGINE ---
    const regPassword = document.getElementById('regPassword');
    const pwStrengthContainer = document.getElementById('pwStrengthContainer');
    const pwStrengthBar = document.getElementById('pwStrengthBar');
    const pwStrengthText = document.getElementById('pwStrengthText');

    regPassword.addEventListener('input', () => {
        const val = regPassword.value;
        if (!val) {
            pwStrengthContainer.style.display = 'none';
            return;
        }
        pwStrengthContainer.style.display = 'block';

        const hasUpper = /[A-Z]/.test(val);
        const hasNumber = /[0-9]/.test(val);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val);

        let score = 0;
        if (val.length >= 6) score++;
        if (hasUpper) score++;
        if (hasNumber) score++;
        if (hasSpecial) score++;

        const levels = [
            { width: '20%', color: 'var(--clr-critical)', text: 'Very Weak' },
            { width: '40%', color: 'var(--clr-warning)', text: 'Weak' },
            { width: '60%', color: '#fbbf24', text: 'Fair' },
            { width: '80%', color: '#84cc16', text: 'Good' },
            { width: '100%', color: 'var(--clr-success)', text: 'Strong' }
        ];

        const res = levels[score] || levels[0];
        pwStrengthBar.style.width = res.width;
        pwStrengthBar.style.background = res.color;
        pwStrengthText.innerText = res.text;
        pwStrengthText.style.color = res.color;
    });

    // --- LOGIN FLOW ---
    if (el.loginForm) el.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('loginIdentifier').value.trim();
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.getElementById('loginSubmitBtn');
        const errDisplay = document.getElementById('loginErrorMsg');

        if (errDisplay) errDisplay.style.display = 'none';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "Signing In...";
        }

        const result = await safeFetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Sign In";
        }

        // NEW - shows error instead of fake demo session
        if (result.networkError) {
            showNotif('Cannot connect to server. Please ensure the backend is running.', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "Sign In";
            }
            return;
        }

        if (result.ok && result.data.success) {
            localStorage.setItem('hg_user_session', JSON.stringify(result.data));
            showNotif('Welcome back!', 'success');
            setTimeout(() => window.location.href = 'index.html', 800);
        } else {
            if (errDisplay) {
                errDisplay.innerText = result.data.error || "Login failed.";
                errDisplay.style.display = 'block';
            }
        }
    });

    // --- REGISTRATION FLOW ---
    let pendingRegEmail = "";

    if (el.registerForm) el.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            full_name: document.getElementById('regFullName').value.trim(),
            phone: document.getElementById('regPhone').value.trim(),
            email: document.getElementById('regEmail').value.trim().toLowerCase(),
            username: document.getElementById('regUsername').value.trim().toLowerCase(),
            password: document.getElementById('regPassword').value,
        };
        const errDisplay = document.getElementById('regErrorMsg');
        if (errDisplay) errDisplay.style.display = 'none';

        const submitBtn = document.getElementById('registerSubmitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "Sending OTP...";
        }

        const result = await safeFetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Send Verification OTP";
        }

        if (result.ok && result.data.success) {
            pendingRegEmail = payload.email;
            const otpMsg = document.getElementById('otpMessage');
            let successTxt = result.data.otp_sent ? `OTP sent to ${payload.email}` : `OTP ready for verification.`;

            // If email failed but registration started (Render fallback), show the error detail
            if (!result.data.otp_sent && result.data.debug_err) {
                successTxt += `\n(Service Error: ${result.data.debug_err})`;
            }

            if (otpMsg) {
                otpMsg.innerText = successTxt; // Use innerText for newlines if needed
                otpMsg.style.display = 'block';
                otpMsg.style.color = result.data.otp_sent ? '#ffffff' : '#ffda6a'; // Warning color if fallback
            }
            if (el.registerForm) el.registerForm.style.display = 'none';
            if (el.registerOtpForm) el.registerOtpForm.style.display = 'block';
            showNotif(result.data.message || 'OTP sent!', 'info');
        } else {
            if (errDisplay) {
                errDisplay.innerText = result.data.error || "Failed to initiate registration.";
                errDisplay.style.display = 'block';
            }
        }
    });

    if (el.registerOtpForm) el.registerOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = document.getElementById('regOtp').value.trim();
        const verifyBtn = document.getElementById('regVerifyBtn');

        if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.innerText = "Verifying...";
        }

        const result = await safeFetch(`${API_BASE}/register-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: pendingRegEmail, otp })
        });

        if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.innerText = "Verify & Create Account";
        }

        if (result.ok && result.data.success) {
            showNotif('Account created! Please sign in.', 'success');
            setTimeout(() => switchTab('login'), 1500);
        } else {
            showNotif(result.data.error || "Invalid OTP", 'error');
        }
    });

    // --- FORGOT PASSWORD FLOW ---
    let pendingForgotEmail = "";

    if (el.forgotPassRequestForm) el.forgotPassRequestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
        const submitBtn = document.getElementById('forgotReqBtn');
        const errDisplay = document.getElementById('forgotErrorMsg');

        if (errDisplay) errDisplay.style.display = 'none';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "Processing...";
        }

        const result = await safeFetch(`${API_BASE}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Send Reset OTP";
        }

        if (result.ok) {
            pendingForgotEmail = email;
            const resetOtpMsg = document.getElementById('resetOtpMessage');
            const masked = result.data.data?.masked_email || email;
            const otpSent = result.data.data?.otp_sent;
            const debugErr = result.data.data?.debug_err;

            if (resetOtpMsg) {
                let msg = `OTP has been sent to ${masked}`;
                if (!otpSent && debugErr) {
                    msg = `Recovery started. (Service Error: ${debugErr})`;
                }
                resetOtpMsg.innerText = msg;
                resetOtpMsg.style.display = 'block';
                resetOtpMsg.style.color = otpSent ? '#ffffff' : '#ffda6a';
            }

            if (el.forgotPassRequestForm) el.forgotPassRequestForm.style.display = 'none';
            if (el.forgotPassResetForm) el.forgotPassResetForm.style.display = 'block';
            showNotif('OTP sent!', 'info');
        } else {
            if (errDisplay) {
                errDisplay.innerText = result.data.error || "Request failed.";
                errDisplay.style.display = 'block';
            }
        }
    });

    if (el.forgotPassResetForm) el.forgotPassResetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            email: pendingForgotEmail,
            otp: document.getElementById('forgotOtp').value.trim(),
            password: document.getElementById('forgotNewPassword').value
        };
        const submitBtn = document.getElementById('forgotResetBtn');
        const errDisplay = document.getElementById('resetErrorMsg');

        if (errDisplay) errDisplay.style.display = 'none';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "Resetting...";
        }

        const result = await safeFetch(`${API_BASE}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Reset Password";
        }

        if (result.ok && result.data.success) {
            showNotif('Password reset! Please sign in.', 'success');
            setTimeout(() => switchTab('login'), 1500);
        } else {
            if (errDisplay) {
                errDisplay.innerText = result.data.error || "Reset failed.";
                errDisplay.style.display = 'block';
            }
        }
    });
});
