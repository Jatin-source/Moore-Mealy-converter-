class MachineInput {
    constructor() {
        this.machineType = 'moore'; // Default
        this.states = ['q0', 'q1'];
        this.inputAlphabet = ['0', '1'];
        this.outputAlphabet = ['0', '1'];
        this.initialState = 'q0';
        
        // Default Moore Machine
        this.outputs = { 'q0': '0', 'q1': '1' };
        this.transitions = [
            { from: 'q0', input: '0', to: 'q1' },
            { from: 'q0', input: '1', to: 'q0' },
            { from: 'q1', input: '0', to: 'q1' },
            { from: 'q1', input: '1', to: 'q0' }
        ];

        this.initDOM();
    }

    initDOM() {
        // Toggle buttons
        document.getElementById('btn-moore-to-mealy').addEventListener('click', () => this.setType('moore'));
        document.getElementById('btn-mealy-to-moore').addEventListener('click', () => this.setType('mealy'));
        
        document.getElementById('btn-validate').addEventListener('click', () => this.validate());
        document.getElementById('btn-convert').addEventListener('click', () => this.convert());
        document.getElementById('btn-demo').addEventListener('click', () => this.loadDemo());

        this.render();
    }

    setType(type) {
        this.machineType = type;
        
        const btnMoore = document.getElementById('btn-moore-to-mealy');
        const btnMealy = document.getElementById('btn-mealy-to-moore');
        
        if (type === 'moore') {
            btnMoore.className = "flex-1 py-2 rounded-md bg-cyber-accent/20 text-cyber-accent shadow-[0_0_10px_rgba(56,189,248,0.2)] transition-all font-medium";
            btnMealy.className = "flex-1 py-2 rounded-md text-gray-400 hover:text-gray-200 transition-all font-medium";
        } else {
            btnMealy.className = "flex-1 py-2 rounded-md bg-cyber-accent/20 text-cyber-accent shadow-[0_0_10px_rgba(56,189,248,0.2)] transition-all font-medium";
            btnMoore.className = "flex-1 py-2 rounded-md text-gray-400 hover:text-gray-200 transition-all font-medium";
        }
        
        // Convert transitions format if switching types (stubbed out for simplicity, usually wipes or adapts)
        this.render();
    }

    getMachineJSON() {
        const base = {
            type: this.machineType,
            states: this.states,
            alphabet: this.inputAlphabet,
            initialState: this.initialState,
            transitions: this.transitions
        };
        
        if (this.machineType === 'moore') {
            base.outputs = this.outputs;
        } else {
            // Recalculate output alphabet for Mealy
            base.outputAlphabet = this.outputAlphabet; 
        }
        
        return base;
    }

    render() {
        const container = document.getElementById('machine-def-container');
        // A minimal JSON editor for Phase 7 until we build the full dynamic table in a later phase
        container.innerHTML = `
            <textarea id="machine-json-editor" rows="12" class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-sm text-green-400 font-mono focus:border-cyber-accent outline-none shadow-inner">${JSON.stringify(this.getMachineJSON(), null, 2)}</textarea>
            <p class="text-xs text-gray-500 mt-2">Edit JSON directly to modify the machine (Dynamic UI tables coming in later phases).</p>
        `;
        
        document.getElementById('machine-json-editor').addEventListener('change', (e) => {
            try {
                const parsed = JSON.parse(e.target.value);
                this.machineType = parsed.type || 'moore';
                this.states = parsed.states || [];
                this.inputAlphabet = parsed.alphabet || [];
                this.initialState = parsed.initialState || '';
                this.outputs = parsed.outputs || {};
                this.transitions = parsed.transitions || [];
            } catch (err) {
                console.warn("Invalid JSON in editor", err);
            }
        });
    }

    async validate() {
        try {
            const result = await window.API.validate(this.getMachineJSON());
            if (result.valid) {
                alert("Machine is Valid!");
            } else {
                alert("Validation Errors:\n" + result.errors.join('\n'));
            }
        } catch (e) {
            alert("Error: " + e.message);
        }
    }

    async convert() {
        try {
            const targetType = this.machineType === 'moore' ? 'mealy' : 'moore';
            const result = await window.API.convert(this.getMachineJSON(), targetType);
            console.log("Converted!", result);
            alert("Conversion complete! Check console for animation steps. SVG rendering coming in Phase 8.");
            
            // Dispatch event for visualization and steps panel
            window.dispatchEvent(new CustomEvent('machine-converted', { detail: result }));
        } catch (e) {
            alert("Conversion Error: " + e.message);
        }
    }

    loadDemo() {
        // Complex State-Splitting Demo (Phase 11 requested this, but good to have now)
        this.setType('mealy');
        this.states = ['q0', 'q1', 'q2'];
        this.inputAlphabet = ['0', '1'];
        this.initialState = 'q0';
        this.transitions = [
            { from: 'q0', input: '0', to: 'q1', output: '0' },
            { from: 'q0', input: '1', to: 'q2', output: '1' },
            { from: 'q1', input: '0', to: 'q1', output: '1' }, // Notice q1 receives output 0 and 1
            { from: 'q1', input: '1', to: 'q2', output: '0' },
            { from: 'q2', input: '0', to: 'q0', output: '1' },
            { from: 'q2', input: '1', to: 'q1', output: '0' }
        ];
        this.render();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.machineInput = new MachineInput();
});
