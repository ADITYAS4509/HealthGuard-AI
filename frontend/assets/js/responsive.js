document.addEventListener('DOMContentLoaded', () => {
    // ── CONFIG ──
    const navSelector = '.navbar-nav, #navbarNav';
    const innerSelector = '.navbar-inner, .navbar';

    let navbarNav = document.querySelector(navSelector);
    let navbarInner = document.querySelector(innerSelector);

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

    // ── TOGGLE LOGIC ──
    const toggleMenu = (e) => {
        if (e) e.stopPropagation();
        navbarNav.classList.toggle('active');
        navbarNav.classList.toggle('open');
        navbarNav.classList.toggle('mobile-open'); // Matches style.css line 2475
        hamburger.classList.toggle('active');
        hamburger.classList.toggle('open');
    };

    hamburger.addEventListener('click', toggleMenu);

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!navbarNav.contains(e.target) && !hamburger.contains(e.target)) {
            navbarNav.classList.remove('active', 'open', 'mobile-open');
            hamburger.classList.remove('active', 'open');
        }
    });

    // Close when clicking a link
    navbarNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navbarNav.classList.remove('active', 'open', 'mobile-open');
            hamburger.classList.remove('active', 'open');
        });
    });
});
