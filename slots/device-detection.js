// Device detection for slots page
// Redirects mobile users to mobile version

// Check if this is the desktop slots page and user is on mobile
if (window.location.pathname.includes('slots.html') && window.innerWidth <= 768) {
    console.log('📱 Mobile device detected, redirecting to mobile slots page');
    window.location.href = 'slots-mobile.html';
}
