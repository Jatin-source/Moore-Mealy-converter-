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
    
    // Theory Modal handlers
    const theoryModal = document.getElementById('theory-modal');
    const btnOpenTheory = document.getElementById('btn-open-theory-modal');
    const btnCloseTheory = document.getElementById('btn-close-theory-modal');

    if (btnOpenTheory && theoryModal) {
        btnOpenTheory.addEventListener('click', () => {
            theoryModal.classList.remove('hidden');
            gsap.fromTo(theoryModal.querySelector('.glass-panel'), 
                { scale: 0.9, opacity: 0 }, 
                { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
            );
        });
    }

    if (btnCloseTheory && theoryModal) {
        btnCloseTheory.addEventListener('click', () => {
            theoryModal.classList.add('hidden');
        });
        theoryModal.addEventListener('click', (e) => {
            if (e.target === theoryModal) {
                theoryModal.classList.add('hidden');
            }
        });
    }

    // Test backend health
    fetch('/api/health')
        .then(res => res.json())
        .then(data => console.log("Backend status:", data))
        .catch(err => console.warn("Backend not running yet.", err));
});
