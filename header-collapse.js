// Header collapse on scroll functionality
// Adds 'collapsed' class to header when scrolled down

(function() {
    'use strict';
    
    // Configuration
    const SCROLL_THRESHOLD = 60; // pixels to scroll before header collapses (aligns with beta triangle)
    const THROTTLE_DELAY = 16; // ~60fps throttling for smooth performance
    
    let ticking = false;
    let lastScrollTop = 0;
    
    // Get header element
    const header = document.querySelector('.header');
    
    if (!header) {
        console.warn('Header collapse: No .header element found');
        return;
    }
    
    // Throttled scroll handler for better performance
    function handleScroll() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }
    
    function updateHeader() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add collapsed class when scrolled past threshold
        if (scrollTop > SCROLL_THRESHOLD) {
            header.classList.add('collapsed');
        } else {
            header.classList.remove('collapsed');
        }
        
        lastScrollTop = scrollTop;
        ticking = false;
    }
    
    // Add transition class for smooth animations
    function addTransitions() {
        const tagline = header.querySelector('.tagline');
        const logo = header.querySelector('.logo h1');
        
        if (tagline) {
            tagline.style.transition = 'opacity 0.3s ease, max-height 0.3s ease';
        }
        
        if (logo) {
            logo.style.transition = 'margin-bottom 0.3s ease';
        }
    }
    
    // Initialize on DOM ready
    function init() {
        // Add CSS transitions
        addTransitions();
        
        // Add scroll listener with throttling
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Handle initial state
        updateHeader();
        
        console.log('Header collapse: Initialized successfully');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Cleanup function (if needed for SPA environments)
    window.headerCollapseCleanup = function() {
        window.removeEventListener('scroll', handleScroll);
    };
    
})();
