document.addEventListener('DOMContentLoaded', () => {
    // Initial GSAP animation for the UI to fade and slide in
    gsap.to('#app-container', {
        opacity: 1,
        duration: 1,
        ease: 'power2.out'
    });

    gsap.from('.glass-panel', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'back.out(1.7)',
        delay: 0.2
    });

    console.log("Moore-Mealy Simulator Frontend Initialized.");
    
    // Test backend health
    fetch('/api/health')
        .then(res => res.json())
        .then(data => console.log("Backend status:", data))
        .catch(err => console.warn("Backend not running yet.", err));
});
