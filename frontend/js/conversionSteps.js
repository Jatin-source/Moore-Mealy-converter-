class ConversionSteps {
    constructor() {
        this.steps = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        
        this.display = document.getElementById('steps-display');
        
        document.getElementById('btn-step-prev').addEventListener('click', () => this.prev());
        document.getElementById('btn-step-next').addEventListener('click', () => this.next());
        document.getElementById('btn-step-play').addEventListener('click', (e) => this.togglePlay(e));

        window.addEventListener('machine-converted', (e) => {
            this.steps = e.detail.steps || [];
            this.currentIndex = 0;
            this.renderStep();
        });
    }

    renderStep() {
        if (!this.steps.length) {
            this.display.innerHTML = "Awaiting conversion...";
            return;
        }
        
        const step = this.steps[this.currentIndex];
        this.display.innerHTML = `
            <div class="flex flex-col gap-2">
                <strong class="text-cyber-accent">Step ${step.step} / ${this.steps.length}</strong>
                <p class="text-gray-200">${step.description}</p>
            </div>
        `;
        
        // Dispatch event for D3 to highlight nodes/edges
        window.dispatchEvent(new CustomEvent('step-changed', { detail: step }));
    }

    next() {
        if (this.currentIndex < this.steps.length - 1) {
            this.currentIndex++;
            this.renderStep();
        } else {
            this.pause();
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderStep();
        }
    }

    togglePlay(e) {
        if (this.isPlaying) {
            this.pause();
            e.target.innerText = "Play";
        } else {
            this.play();
            e.target.innerText = "Pause";
        }
    }

    play() {
        this.isPlaying = true;
        if (this.currentIndex >= this.steps.length - 1) {
            this.currentIndex = 0; // Restart if at end
        }
        this.timer = setInterval(() => {
            this.next();
        }, 1500); // 1.5s per step
    }

    pause() {
        this.isPlaying = false;
        clearInterval(this.timer);
        document.getElementById('btn-step-play').innerText = "Play";
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.conversionSteps = new ConversionSteps();
});
