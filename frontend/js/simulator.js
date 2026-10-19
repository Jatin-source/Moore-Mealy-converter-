/**
 * Interactive Automata String Simulator
 * Features:
 * - Step-by-step interactive tape head execution
 * - Live symbol-by-symbol tape visualization with glowing pointer
 * - Emitted output accumulator with Moore initial-state badge
 * - Speed control slider (150ms - 2000ms)
 * - Play / Pause / Step Forward / Step Backward / Reset controls
 * - Quick sample expressions chips & random string generator
 * - Dispatches 'sim-step-active' to trigger D3 particle physics on the diagram
 */
class StringSimulator {
    constructor() {
        this.inputElement = document.getElementById('sim-input');
        this.tapeContainer = document.getElementById('sim-tape-container');
        this.outputDisplay = document.getElementById('sim-output-stream');
        this.infoBanner = document.getElementById('sim-step-info');
        this.speedSlider = document.getElementById('sim-speed-slider');

        this.currentSimulationResult = null;
        this.currentStepIndex = -1;
        this.isPlaying = false;
        this.playbackInterval = null;
        this.stepDelayMs = 600;

        this.initDOM();
    }

    initDOM() {
        // Buttons
        document.getElementById('btn-sim-play')?.addEventListener('click', () => this.togglePlay());
        document.getElementById('btn-sim-step-fwd')?.addEventListener('click', () => this.stepForward());
        document.getElementById('btn-sim-step-back')?.addEventListener('click', () => this.stepBackward());
        document.getElementById('btn-sim-reset')?.addEventListener('click', () => this.resetSimulation());
        document.getElementById('btn-sim-load')?.addEventListener('click', () => this.loadAndPrepareSimulation());

        // Quick sample chips
        document.querySelectorAll('.sample-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const expr = e.target.getAttribute('data-expr');
                if (expr && this.inputElement) {
                    this.inputElement.value = expr;
                    this.loadAndPrepareSimulation();
                }
            });
        });

        // Random expression generator
        document.getElementById('btn-sim-random')?.addEventListener('click', () => this.generateRandomExpression());

        // Speed slider
        if (this.speedSlider) {
            this.speedSlider.addEventListener('input', (e) => {
                // Inverted so right is faster (shorter delay)
                this.stepDelayMs = 2100 - parseInt(e.target.value);
                if (this.isPlaying) {
                    this.pause();
                    this.play();
                }
            });
        }

        // On Enter in input box, run simulation
        this.inputElement?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.loadAndPrepareSimulation();
            }
        });
    }

    generateRandomExpression() {
        const machine = window.machineInput ? window.machineInput.getMachineJSON() : null;
        const alphabet = (machine && machine.alphabet && machine.alphabet.length > 0) ? machine.alphabet : ['0', '1'];
        const len = Math.floor(Math.random() * 6) + 4; // 4 to 9 chars
        let res = "";
        for (let i = 0; i < len; i++) {
            res += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        if (this.inputElement) {
            this.inputElement.value = res;
            this.loadAndPrepareSimulation();
        }
    }

    async loadAndPrepareSimulation() {
        const inputString = this.inputElement ? this.inputElement.value.trim() : "";
        if (!inputString) {
            alert("Please enter an input expression to simulate.");
            return;
        }

        const machine = window.machineInput ? window.machineInput.getMachineJSON() : null;
        if (!machine) return;

        this.pause();
        this.resetSimulationUI();

        if (this.infoBanner) {
            this.infoBanner.innerHTML = `<span class="text-cyber-accent animate-pulse">Computing simulation on backend engine...</span>`;
        }

        try {
            const result = await window.API.simulate(machine, inputString);
            this.currentSimulationResult = result;
            this.currentStepIndex = -1;

            this.renderTape(inputString);
            this.updateControlsState(true);

            if (this.infoBanner) {
                this.infoBanner.innerHTML = `
                    <div class="flex items-center justify-between text-xs font-mono text-gray-300">
                        <span>Ready to simulate: <strong>${inputString.length}</strong> symbols</span>
                        <span class="text-cyber-accent">Press [▶ Play] or [Step ⏭]</span>
                    </div>
                `;
            }

            // Immediately step to initial state
            this.stepForward();

        } catch (err) {
            if (this.infoBanner) {
                this.infoBanner.innerHTML = `<span class="text-red-400 font-mono text-xs">Simulation Failed: ${err.message}</span>`;
            }
        }
    }

    renderTape(inputString) {
        if (!this.tapeContainer) return;
        this.tapeContainer.innerHTML = inputString.split('').map((char, idx) => `
            <div id="tape-cell-${idx}" class="tape-cell relative flex flex-col items-center justify-center min-w-[36px] h-11 rounded-lg border border-gray-700 bg-gray-900/80 font-mono font-bold text-gray-400 text-sm transition-all duration-200">
                <span>${char}</span>
                <span class="text-[9px] text-gray-600 font-normal absolute -bottom-4">${idx}</span>
            </div>
        `).join('');
    }

    stepForward() {
        if (!this.currentSimulationResult) return;
        const path = this.currentSimulationResult.path;

        if (this.currentStepIndex < path.length - 1) {
            this.currentStepIndex++;
            this.renderCurrentStep();
        } else {
            this.pause();
            if (this.infoBanner) {
                this.infoBanner.innerHTML = `
                    <div class="flex items-center justify-between text-xs font-mono text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
                        <span>✓ Simulation Completed! Final State: <strong>${this.currentSimulationResult.final_state}</strong></span>
                        <span>Total Output: <strong>${this.currentSimulationResult.output_string}</strong></span>
                    </div>
                `;
            }
        }
    }

    stepBackward() {
        if (!this.currentSimulationResult) return;
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.renderCurrentStep();
        }
    }

    renderCurrentStep() {
        const result = this.currentSimulationResult;
        const step = result.path[this.currentStepIndex];
        const machine = window.machineInput ? window.machineInput.getMachineJSON() : null;

        // 1. Update Tape Highlighting
        document.querySelectorAll('.tape-cell').forEach((cell, idx) => {
            // step.step: 0 is Moore pre-input, 1 is first char (index 0)
            const activeCharIndex = step.step - 1;
            if (idx === activeCharIndex) {
                cell.className = "tape-cell relative flex flex-col items-center justify-center min-w-[36px] h-11 rounded-lg border-2 border-cyber-accent bg-cyber-accent/20 font-mono font-extrabold text-white text-base shadow-[0_0_12px_rgba(56,189,248,0.5)] scale-110 transition-all duration-200";
            } else if (idx < activeCharIndex) {
                cell.className = "tape-cell relative flex flex-col items-center justify-center min-w-[36px] h-11 rounded-lg border border-gray-800 bg-gray-950/60 font-mono font-medium text-gray-500 text-sm transition-all duration-200";
            } else {
                cell.className = "tape-cell relative flex flex-col items-center justify-center min-w-[36px] h-11 rounded-lg border border-gray-700 bg-gray-900/80 font-mono font-bold text-gray-300 text-sm transition-all duration-200";
            }
        });

        // 2. Update Output Stream
        if (this.outputDisplay) {
            const accumulatedOutputs = result.path.slice(0, this.currentStepIndex + 1);
            this.outputDisplay.innerHTML = accumulatedOutputs.map((s, idx) => {
                const isLatest = (idx === this.currentStepIndex);
                if (s.step === 0 && machine && machine.type === 'moore') {
                    return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40" title="Moore initial state output (pre-input)">${s.output} <span class="text-[9px] font-normal ml-1 opacity-75">(q₀)</span></span>`;
                }
                return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${isLatest ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] scale-110' : 'bg-gray-800 text-gray-300 border border-gray-700'}">${s.output}</span>`;
            }).join(' ');
        }

        // 3. Update Step Information Banner
        if (this.infoBanner) {
            if (step.step === 0) {
                this.infoBanner.innerHTML = `
                    <div class="flex items-center gap-2 text-xs font-mono text-amber-300">
                        <span class="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 font-bold">Step 0 (Initial)</span>
                        <span>Moore Machine begins at state <strong>${step.state}</strong> with pre-input output <strong>'${step.output}'</strong></span>
                    </div>
                `;
            } else {
                const prevStep = result.path[this.currentStepIndex - 1];
                this.infoBanner.innerHTML = `
                    <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <div class="flex items-center gap-2 text-gray-300">
                            <span class="px-2 py-0.5 rounded bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30 font-bold">Step ${step.step}</span>
                            <span>Read: <strong class="text-white bg-gray-800 px-1.5 py-0.5 rounded">'${step.input}'</strong></span>
                            <span>State: <strong class="text-sky-300">${prevStep ? prevStep.state : step.state}</strong> → <strong class="text-emerald-400">${step.state}</strong></span>
                        </div>
                        <div class="text-emerald-400">
                            Emitted Output: <strong class="text-base text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">'${step.output}'</strong>
                        </div>
                    </div>
                `;

                // 4. Trigger D3 Particle Animation on Graph
                if (prevStep) {
                    window.dispatchEvent(new CustomEvent('sim-step-active', {
                        detail: {
                            fromState: prevStep.state,
                            symbol: step.input,
                            toState: step.state,
                            output: step.output,
                            stepIndex: this.currentStepIndex
                        }
                    }));
                }
            }
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (!this.currentSimulationResult) return;
        this.isPlaying = true;

        const btnPlay = document.getElementById('btn-sim-play');
        if (btnPlay) {
            btnPlay.innerHTML = `<span>⏸</span> <span>Pause</span>`;
            btnPlay.classList.add('bg-amber-600', 'hover:bg-amber-500');
            btnPlay.classList.remove('bg-cyber-accent');
        }

        // If at the end, restart
        if (this.currentStepIndex >= this.currentSimulationResult.path.length - 1) {
            this.currentStepIndex = -1;
            this.stepForward();
        }

        this.playbackInterval = setInterval(() => {
            if (this.currentStepIndex < this.currentSimulationResult.path.length - 1) {
                this.stepForward();
            } else {
                this.pause();
            }
        }, this.stepDelayMs);
    }

    pause() {
        this.isPlaying = false;
        clearInterval(this.playbackInterval);

        const btnPlay = document.getElementById('btn-sim-play');
        if (btnPlay) {
            btnPlay.innerHTML = `<span>▶</span> <span>Play</span>`;
            btnPlay.classList.remove('bg-amber-600', 'hover:bg-amber-500');
            btnPlay.classList.add('bg-cyber-accent');
        }
    }

    resetSimulation() {
        this.pause();
        this.currentStepIndex = -1;
        this.resetSimulationUI();
        window.dispatchEvent(new CustomEvent('sim-reset'));
    }

    resetSimulationUI() {
        document.querySelectorAll('.tape-cell').forEach(c => {
            c.className = "tape-cell relative flex flex-col items-center justify-center min-w-[36px] h-11 rounded-lg border border-gray-700 bg-gray-900/80 font-mono font-bold text-gray-300 text-sm";
        });
        if (this.outputDisplay) {
            this.outputDisplay.innerHTML = `<span class="text-gray-500 italic text-xs">Awaiting execution...</span>`;
        }
        if (this.infoBanner) {
            this.infoBanner.innerHTML = `<span class="text-gray-500 text-xs">Enter an expression and hit Simulate to begin.</span>`;
        }
    }

    updateControlsState(enabled) {
        ['btn-sim-play', 'btn-sim-step-fwd', 'btn-sim-step-back', 'btn-sim-reset'].forEach(id => {
            const b = document.getElementById(id);
            if (b) {
                b.disabled = !enabled;
                if (enabled) {
                    b.classList.remove('opacity-50', 'cursor-not-allowed');
                } else {
                    b.classList.add('opacity-50', 'cursor-not-allowed');
                }
            }
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.simulator = new StringSimulator();
});
