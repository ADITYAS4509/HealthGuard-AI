document.addEventListener('DOMContentLoaded', () => {
    const navbarNav = document.querySelector('.navbar-nav');
    const navbarInner = document.querySelector('.navbar-inner');

    // Create Hamburger Button
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.setAttribute('aria-label', 'Toggle navigation');
    hamburger.innerHTML = '<span></span><span></span><span></span>';

    // Insert hamburger into navbar-inner
    navbarInner.appendChild(hamburger);

    // Toggle Menu
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        navbarNav.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!navbarNav.contains(e.target) && !hamburger.contains(e.target)) {
            navbarNav.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });

    // Close when clicking a link
    navbarNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navbarNav.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
});
