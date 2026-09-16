class Simulator {
    constructor() {
        this.inputElement = document.getElementById('sim-input');
        this.outputElement = document.getElementById('sim-output');
        
        document.getElementById('btn-simulate').addEventListener('click', () => this.runSimulation());
    }

    async runSimulation() {
        const inputString = this.inputElement.value.trim();
        if (!inputString) {
            alert("Please enter an input string first.");
            return;
        }

        const machine = window.machineInput.getMachineJSON();

        try {
            this.outputElement.classList.remove('hidden');
            this.outputElement.innerHTML = `<span class="text-cyber-accent animate-pulse">Running simulation on backend...</span>`;
            
            const result = await window.API.simulate(machine, inputString);
            
            this.outputElement.innerHTML = `
                <div class="flex flex-col gap-1">
                    <div><span class="text-gray-500">Input:</span> <span class="text-white">${result.input_string}</span></div>
                    <div><span class="text-gray-500">Output:</span> <span class="text-green-400 font-bold">${result.output_string}</span></div>
                    <div><span class="text-gray-500">Final State:</span> <span class="text-cyber-accent">${result.final_state}</span></div>
                    <div class="mt-2 text-xs text-gray-500">Path sequence sent to visualization engine.</div>
                </div>
            `;
            
            // Dispatch event so D3 visualization can animate the path
            window.dispatchEvent(new CustomEvent('simulation-complete', { detail: result }));
            
        } catch (e) {
            this.outputElement.innerHTML = `<span class="text-red-400">Simulation Error: ${e.message}</span>`;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.simulator = new Simulator();
});
