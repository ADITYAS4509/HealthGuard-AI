document.addEventListener('DOMContentLoaded', () => {
    // ── CONFIG ──
    const navSelector = '#navbarNav, .navbar-nav';
    const innerSelector = '.navbar-inner, .navbar';

    const navbarNav = document.querySelector(navSelector);
    const navbarInner = document.querySelector(innerSelector);

    if (!navbarNav || !navbarInner) return;

    // ── HAMBURGER BUTTON ──
    let hamburger = document.getElementById('hamburgerBtn') || document.querySelector('.hamburger');

    if (!hamburger) {
        hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.id = 'hamburgerBtn';
        hamburger.setAttribute('aria-label', 'Toggle navigation');
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        navbarInner.appendChild(hamburger);
    }

    // ── OVERLAY (dim background behind side panel) ──
    let overlay = document.getElementById('navOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'navOverlay';
        overlay.style.cssText = [
            'display:none',
            'position:fixed',
            'inset:0',
            'background:rgba(0,0,0,0.55)',
            'z-index:1049',
            'transition:opacity 0.2s'
        ].join(';');
        document.body.appendChild(overlay);
    }

    // ── OPEN / CLOSE ──
    const openMenu = () => {
        navbarNav.classList.add('active', 'open', 'mobile-open');
        hamburger.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        overlay.style.display = 'block';
    };

    const closeMenu = () => {
        navbarNav.classList.remove('active', 'open', 'mobile-open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        overlay.style.display = 'none';
    };

    const toggleMenu = (e) => {
        if (e) e.stopPropagation();
        navbarNav.classList.contains('active') ? closeMenu() : openMenu();
    };

    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);

    // Close when clicking a link inside the menu
    navbarNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
});
