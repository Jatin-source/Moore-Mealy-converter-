/**
 * Interactive Machine Input Manager
 * Supports:
 * - Dynamic interactive visual transition/output tables
 * - Dynamic state/alphabet badge managers (+ Add / - Remove)
 * - Initial state selector dropdown
 * - Presets library with 7 classic and edge-case automata
 * - Two-way sync between Visual Table and JSON Editor
 * - Real-time graph updates on any modification
 */
class MachineInput {
    constructor() {
        this.currentPresetId = "state_splitting_demo";
        this.activeEditorTab = "visual"; // "visual" or "json"
        
        // Load default preset (State-Splitting Demo)
        this.loadPreset(this.currentPresetId, false);

        this.initDOM();
    }

    initDOM() {
        // Preset Dropdown
        const presetSelect = document.getElementById('preset-select');
        if (presetSelect) {
            presetSelect.addEventListener('change', (e) => {
                this.loadPreset(e.target.value, true);
            });
        }

        // Machine Type Toggles
        document.getElementById('btn-moore-to-mealy')?.addEventListener('click', () => this.setType('moore'));
        document.getElementById('btn-mealy-to-moore')?.addEventListener('click', () => this.setType('mealy'));

        // Editor Tab Toggles
        document.getElementById('tab-btn-visual')?.addEventListener('click', () => this.setEditorTab('visual'));
        document.getElementById('tab-btn-json')?.addEventListener('click', () => this.setEditorTab('json'));

        // Action Buttons
        document.getElementById('btn-validate')?.addEventListener('click', () => this.validate());
        document.getElementById('btn-convert')?.addEventListener('click', () => this.convert());
        document.getElementById('btn-reset-machine')?.addEventListener('click', () => this.resetMachine());

        this.render();
    }

    loadPreset(presetId, triggerRender = true) {
        this.currentPresetId = presetId;
        const preset = window.PRESETS ? window.PRESETS[presetId] : null;

        if (preset) {
            this.machineType = preset.type;
            this.states = [...preset.states];
            this.inputAlphabet = [...preset.inputAlphabet];
            this.outputAlphabet = [...preset.outputAlphabet];
            this.initialState = preset.initialState;
            this.transitions = JSON.parse(JSON.stringify(preset.transitions));
            this.outputs = preset.outputs ? JSON.parse(JSON.stringify(preset.outputs)) : {};

            // Update sample string in simulator if available
            if (preset.sampleStrings && preset.sampleStrings.length > 0) {
                const simInput = document.getElementById('sim-input');
                if (simInput) simInput.value = preset.sampleStrings[0];
            }
        } else {
            // Default blank custom Moore machine
            this.machineType = 'moore';
            this.states = ['q0', 'q1'];
            this.inputAlphabet = ['0', '1'];
            this.outputAlphabet = ['0', '1'];
            this.initialState = 'q0';
            this.outputs = { 'q0': '0', 'q1': '1' };
            this.transitions = [
                { from: 'q0', input: '0', to: 'q1' },
                { from: 'q0', input: '1', to: 'q0' },
                { from: 'q1', input: '0', to: 'q1' },
                { from: 'q1', input: '1', to: 'q0' }
            ];
        }

        this.updateTypeButtonsUI();
        if (triggerRender) {
            this.render();
            this.notifyMachineUpdated();
        }
    }

    setType(type) {
        if (this.machineType === type) return;
        this.machineType = type;
        this.currentPresetId = "custom";

        const presetSelect = document.getElementById('preset-select');
        if (presetSelect) presetSelect.value = "custom";

        // Adapt transitions/outputs when switching type
        if (this.machineType === 'moore') {
            // Mealy -> Moore transition conversion
            this.outputs = {};
            this.states.forEach(s => {
                this.outputs[s] = this.outputAlphabet[0] || "0";
            });
            this.transitions = this.transitions.map(t => ({
                from: t.from,
                input: t.input,
                to: t.to
            }));
        } else {
            // Moore -> Mealy transition conversion
            this.transitions = this.transitions.map(t => ({
                from: t.from,
                input: t.input,
                to: t.to,
                output: this.outputs[t.to] || this.outputAlphabet[0] || "0"
            }));
            delete this.outputs;
        }

        this.updateTypeButtonsUI();
        this.render();
        this.notifyMachineUpdated();
    }

    updateTypeButtonsUI() {
        const btnMoore = document.getElementById('btn-moore-to-mealy');
        const btnMealy = document.getElementById('btn-mealy-to-moore');
        const targetBadge = document.getElementById('target-type-badge');

        if (this.machineType === 'moore') {
            if (btnMoore) {
                btnMoore.className = "flex-1 py-2 rounded-lg bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40 shadow-[0_0_12px_rgba(56,189,248,0.25)] font-semibold text-sm transition-all";
            }
            if (btnMealy) {
                btnMealy.className = "flex-1 py-2 rounded-lg text-gray-400 hover:text-gray-200 border border-transparent font-medium text-sm transition-all";
            }
            if (targetBadge) {
                targetBadge.innerText = "Target: Mealy Machine (Preserves States)";
            }
        } else {
            if (btnMealy) {
                btnMealy.className = "flex-1 py-2 rounded-lg bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40 shadow-[0_0_12px_rgba(56,189,248,0.25)] font-semibold text-sm transition-all";
            }
            if (btnMoore) {
                btnMoore.className = "flex-1 py-2 rounded-lg text-gray-400 hover:text-gray-200 border border-transparent font-medium text-sm transition-all";
            }
            if (targetBadge) {
                targetBadge.innerText = "Target: Moore Machine (State Splitting if needed)";
            }
        }
    }

    setEditorTab(tab) {
        this.activeEditorTab = tab;
        const tabVisual = document.getElementById('tab-btn-visual');
        const tabJson = document.getElementById('tab-btn-json');
        const visualContainer = document.getElementById('visual-editor-container');
        const jsonContainer = document.getElementById('json-editor-container');

        if (tab === 'visual') {
            tabVisual?.classList.add('bg-gray-800', 'text-cyber-accent', 'border-gray-700');
            tabVisual?.classList.remove('text-gray-400');
            tabJson?.classList.remove('bg-gray-800', 'text-cyber-accent', 'border-gray-700');
            tabJson?.classList.add('text-gray-400');
            visualContainer?.classList.remove('hidden');
            jsonContainer?.classList.add('hidden');
            this.renderVisualTable();
        } else {
            tabJson?.classList.add('bg-gray-800', 'text-cyber-accent', 'border-gray-700');
            tabJson?.classList.remove('text-gray-400');
            tabVisual?.classList.remove('bg-gray-800', 'text-cyber-accent', 'border-gray-700');
            tabVisual?.classList.add('text-gray-400');
            jsonContainer?.classList.remove('hidden');
            visualContainer?.classList.add('hidden');
            this.renderJSONEditor();
        }
    }

    getMachineJSON() {
        const base = {
            type: this.machineType,
            states: [...this.states],
            alphabet: [...this.inputAlphabet],
            initialState: this.initialState,
            transitions: JSON.parse(JSON.stringify(this.transitions))
        };

        if (this.machineType === 'moore') {
            base.outputs = { ...this.outputs };
            base.outputAlphabet = [...this.outputAlphabet];
        } else {
            base.outputAlphabet = [...this.outputAlphabet];
        }

        return base;
    }

    notifyMachineUpdated() {
        window.dispatchEvent(new CustomEvent('machine-updated', { detail: this.getMachineJSON() }));
    }

    render() {
        this.renderBadges();
        this.renderInitialStateDropdown();
        if (this.activeEditorTab === 'visual') {
            this.renderVisualTable();
        } else {
            this.renderJSONEditor();
        }
    }

    renderBadges() {
        // 1. States Badges
        const statesList = document.getElementById('states-badge-list');
        if (statesList) {
            statesList.innerHTML = this.states.map(s => `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${s === this.initialState ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-sky-500/10 text-sky-300 border border-sky-500/30'}">
                    ${s === this.initialState ? '★ ' : ''}${s}
                    <button class="text-gray-400 hover:text-red-400 ml-0.5 transition-colors" onclick="window.machineInput.removeState('${s}')" title="Remove State">×</button>
                </span>
            `).join('');
        }

        // 2. Input Alphabet Badges
        const inputsList = document.getElementById('inputs-badge-list');
        if (inputsList) {
            inputsList.innerHTML = this.inputAlphabet.map(a => `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    '${a}'
                    <button class="text-gray-400 hover:text-red-400 ml-0.5 transition-colors" onclick="window.machineInput.removeInputSymbol('${a}')" title="Remove Symbol">×</button>
                </span>
            `).join('');
        }

        // 3. Output Alphabet Badges
        const outputsList = document.getElementById('outputs-badge-list');
        if (outputsList) {
            outputsList.innerHTML = this.outputAlphabet.map(o => `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    '${o}'
                    <button class="text-gray-400 hover:text-red-400 ml-0.5 transition-colors" onclick="window.machineInput.removeOutputSymbol('${o}')" title="Remove Output">×</button>
                </span>
            `).join('');
        }
    }

    renderInitialStateDropdown() {
        const select = document.getElementById('initial-state-select');
        if (!select) return;

        select.innerHTML = this.states.map(s => `
            <option value="${s}" ${s === this.initialState ? 'selected' : ''}>${s}${s === this.initialState ? ' (Initial)' : ''}</option>
        `).join('');

        select.onchange = (e) => {
            this.initialState = e.target.value;
            this.currentPresetId = "custom";
            this.renderBadges();
            this.notifyMachineUpdated();
        };
    }

    renderVisualTable() {
        const container = document.getElementById('transition-table-container');
        if (!container) return;

        if (this.states.length === 0 || this.inputAlphabet.length === 0) {
            container.innerHTML = `<div class="p-4 text-center text-gray-500 text-xs">Add at least one state and one input symbol to configure transitions.</div>`;
            return;
        }

        // Build Table Header
        let thInputs = this.inputAlphabet.map(a => `
            <th class="px-3 py-2 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider bg-gray-800/80 border-l border-gray-700/60">
                Input '${a}' ${this.machineType === 'mealy' ? '<br><span class="text-[10px] text-gray-400 font-normal">(Next State / Out)</span>' : '<br><span class="text-[10px] text-gray-400 font-normal">(Next State)</span>'}
            </th>
        `).join('');

        let thead = `
            <thead>
                <tr class="border-b border-gray-700/80 bg-gray-900/60">
                    <th class="px-3 py-2 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">State</th>
                    ${this.machineType === 'moore' ? '<th class="px-3 py-2 text-center text-xs font-semibold text-purple-300 uppercase tracking-wider bg-purple-950/20 border-l border-gray-700/60">Output λ(q)</th>' : ''}
                    ${thInputs}
                </tr>
            </thead>
        `;

        // Build Table Rows
        let tbody = `<tbody>` + this.states.map(s => {
            // Moore state output dropdown
            let mooreOutCell = '';
            if (this.machineType === 'moore') {
                const currentOut = this.outputs[s] || (this.outputAlphabet[0] || '0');
                const outOptions = this.outputAlphabet.map(o => `
                    <option value="${o}" ${o === currentOut ? 'selected' : ''}>${o}</option>
                `).join('');

                mooreOutCell = `
                    <td class="px-3 py-2 text-center border-l border-gray-700/40 bg-purple-950/10">
                        <select class="bg-gray-900 text-purple-300 font-mono text-xs rounded px-2 py-1 border border-purple-500/40 focus:border-purple-400 outline-none"
                                onchange="window.machineInput.updateMooreOutput('${s}', this.value)">
                            ${outOptions}
                        </select>
                    </td>
                `;
            }

            // Input transition cells
            let inputCells = this.inputAlphabet.map(a => {
                const t = this.transitions.find(tr => tr.from === s && tr.input === a);
                const currentNext = t ? t.to : (this.states[0] || '');
                const currentOut = (t && t.output) ? t.output : (this.outputAlphabet[0] || '0');

                const stateOptions = this.states.map(st => `
                    <option value="${st}" ${st === currentNext ? 'selected' : ''}>${st}</option>
                `).join('');

                if (this.machineType === 'moore') {
                    return `
                        <td class="px-3 py-2 text-center border-l border-gray-700/40">
                            <select class="bg-gray-900 text-sky-300 font-mono text-xs rounded px-2 py-1 border border-gray-700 hover:border-sky-500/60 focus:border-sky-400 outline-none w-full max-w-[80px]"
                                    onchange="window.machineInput.updateMooreTransition('${s}', '${a}', this.value)">
                                ${stateOptions}
                            </select>
                        </td>
                    `;
                } else {
                    // Mealy dual input: Next State + Output
                    const outOptions = this.outputAlphabet.map(o => `
                        <option value="${o}" ${o === currentOut ? 'selected' : ''}>${o}</option>
                    `).join('');

                    return `
                        <td class="px-2 py-2 text-center border-l border-gray-700/40">
                            <div class="inline-flex items-center gap-1">
                                <select class="bg-gray-900 text-sky-300 font-mono text-xs rounded px-1.5 py-1 border border-gray-700 hover:border-sky-500 focus:border-sky-400 outline-none"
                                        onchange="window.machineInput.updateMealyTransition('${s}', '${a}', this.value, null)">
                                    ${stateOptions}
                                </select>
                                <span class="text-gray-500 text-xs font-bold">/</span>
                                <select class="bg-gray-900 text-purple-300 font-mono text-xs rounded px-1.5 py-1 border border-purple-500/40 hover:border-purple-400 focus:border-purple-400 outline-none"
                                        onchange="window.machineInput.updateMealyTransition('${s}', '${a}', null, this.value)">
                                    ${outOptions}
                                </select>
                            </div>
                        </td>
                    `;
                }
            }).join('');

            return `
                <tr class="border-b border-gray-800/80 hover:bg-gray-800/30 transition-colors">
                    <td class="px-3 py-2 text-left font-mono text-xs font-bold text-gray-200">
                        <span class="inline-flex items-center gap-1.5">
                            ${s === this.initialState ? '<span class="text-amber-400 text-xs" title="Initial State">★</span>' : ''}
                            ${s}
                        </span>
                    </td>
                    ${mooreOutCell}
                    ${inputCells}
                </tr>
            `;
        }).join('') + `</tbody>`;

        container.innerHTML = `
            <div class="overflow-x-auto rounded-xl border border-gray-700/70 bg-gray-900/50">
                <table class="w-full text-left border-collapse">
                    ${thead}
                    ${tbody}
                </table>
            </div>
        `;
    }

    renderJSONEditor() {
        const textarea = document.getElementById('machine-json-editor');
        if (textarea) {
            textarea.value = JSON.stringify(this.getMachineJSON(), null, 2);
            textarea.oninput = (e) => {
                try {
                    const parsed = JSON.parse(e.target.value);
                    if (parsed.states && parsed.alphabet) {
                        this.machineType = parsed.type || 'moore';
                        this.states = parsed.states;
                        this.inputAlphabet = parsed.alphabet;
                        this.outputAlphabet = parsed.outputAlphabet || Object.values(parsed.outputs || {}) || ['0', '1'];
                        this.initialState = parsed.initialState || parsed.states[0];
                        this.outputs = parsed.outputs || {};
                        this.transitions = parsed.transitions || [];
                        this.currentPresetId = "custom";

                        const presetSelect = document.getElementById('preset-select');
                        if (presetSelect) presetSelect.value = "custom";

                        this.updateTypeButtonsUI();
                        this.renderBadges();
                        this.renderInitialStateDropdown();
                        this.notifyMachineUpdated();
                    }
                } catch (err) {
                    // Waiting for user to complete JSON
                }
            };
        }
    }

    // Dynamic Updates
    updateMooreOutput(state, outVal) {
        this.outputs[state] = outVal;
        this.currentPresetId = "custom";
        this.notifyMachineUpdated();
    }

    updateMooreTransition(fromState, inputSymbol, toState) {
        const existing = this.transitions.find(t => t.from === fromState && t.input === inputSymbol);
        if (existing) {
            existing.to = toState;
        } else {
            this.transitions.push({ from: fromState, input: inputSymbol, to: toState });
        }
        this.currentPresetId = "custom";
        this.notifyMachineUpdated();
    }

    updateMealyTransition(fromState, inputSymbol, nextState, outVal) {
        let existing = this.transitions.find(t => t.from === fromState && t.input === inputSymbol);
        if (!existing) {
            existing = {
                from: fromState,
                input: inputSymbol,
                to: this.states[0] || 'q0',
                output: this.outputAlphabet[0] || '0'
            };
            this.transitions.push(existing);
        }

        if (nextState !== null) existing.to = nextState;
        if (outVal !== null) existing.output = outVal;

        this.currentPresetId = "custom";
        this.notifyMachineUpdated();
    }

    // State & Alphabet Management
    addState(nameInput = null) {
        let name = nameInput;
        if (!name) {
            let i = 0;
            while (this.states.includes(`q${i}`)) i++;
            name = `q${i}`;
        }
        name = name.trim();
        if (!name || this.states.includes(name)) return;

        this.states.push(name);
        if (this.machineType === 'moore') {
            this.outputs[name] = this.outputAlphabet[0] || "0";
        }

        // Initialize transitions for this new state
        this.inputAlphabet.forEach(a => {
            if (this.machineType === 'moore') {
                this.transitions.push({ from: name, input: a, to: name });
            } else {
                this.transitions.push({ from: name, input: a, to: name, output: this.outputAlphabet[0] || "0" });
            }
        });

        this.currentPresetId = "custom";
        this.render();
        this.notifyMachineUpdated();
    }

    removeState(stateName) {
        if (this.states.length <= 1) {
            alert("A machine must have at least one state.");
            return;
        }

        this.states = this.states.filter(s => s !== stateName);
        this.transitions = this.transitions.filter(t => t.from !== stateName && t.to !== stateName);
        if (this.outputs) delete this.outputs[stateName];

        if (this.initialState === stateName) {
            this.initialState = this.states[0];
        }

        // Fix transitions pointing to removed state by pointing to first available state
        this.transitions.forEach(t => {
            if (t.to === stateName) t.to = this.states[0];
        });

        this.currentPresetId = "custom";
        this.render();
        this.notifyMachineUpdated();
    }

    addInputSymbol(symbol) {
        if (!symbol) return;
        symbol = symbol.trim();
        if (this.inputAlphabet.includes(symbol)) return;

        this.inputAlphabet.push(symbol);

        // Add default transitions for all states on this new symbol
        this.states.forEach(s => {
            if (this.machineType === 'moore') {
                this.transitions.push({ from: s, input: symbol, to: s });
            } else {
                this.transitions.push({ from: s, input: symbol, to: s, output: this.outputAlphabet[0] || "0" });
            }
        });

        this.currentPresetId = "custom";
        this.render();
        this.notifyMachineUpdated();
    }

    removeInputSymbol(symbol) {
        if (this.inputAlphabet.length <= 1) {
            alert("Alphabet must contain at least one symbol.");
            return;
        }

        this.inputAlphabet = this.inputAlphabet.filter(a => a !== symbol);
        this.transitions = this.transitions.filter(t => t.input !== symbol);

        this.currentPresetId = "custom";
        this.render();
        this.notifyMachineUpdated();
    }

    addOutputSymbol(symbol) {
        if (!symbol) return;
        symbol = symbol.trim();
        if (this.outputAlphabet.includes(symbol)) return;

        this.outputAlphabet.push(symbol);
        this.currentPresetId = "custom";
        this.render();
        this.notifyMachineUpdated();
    }

    removeOutputSymbol(symbol) {
        if (this.outputAlphabet.length <= 1) {
            alert("Output alphabet must contain at least one symbol.");
            return;
        }

        this.outputAlphabet = this.outputAlphabet.filter(o => o !== symbol);

        // Fix any state or transition referencing this output
        if (this.machineType === 'moore') {
            for (const s in this.outputs) {
                if (this.outputs[s] === symbol) {
                    this.outputs[s] = this.outputAlphabet[0];
                }
            }
        } else {
            this.transitions.forEach(t => {
                if (t.output === symbol) t.output = this.outputAlphabet[0];
            });
        }

        this.currentPresetId = "custom";
        this.render();
        this.notifyMachineUpdated();
    }

    resetMachine() {
        if (confirm("Reset current machine back to default state?")) {
            this.loadPreset("state_splitting_demo", true);
        }
    }

    async validate() {
        const feedbackEl = document.getElementById('validation-feedback');
        try {
            const result = await window.API.validate(this.getMachineJSON());
            if (feedbackEl) {
                feedbackEl.classList.remove('hidden');
                if (result.valid) {
                    feedbackEl.className = "p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2";
                    feedbackEl.innerHTML = `<span class="text-base">✓</span> <span><strong>Machine is Valid!</strong> All transitions, states, and alphabets strictly satisfy Automata Theory requirements.</span>`;
                } else {
                    feedbackEl.className = "p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex flex-col gap-1";
                    feedbackEl.innerHTML = `
                        <div class="font-bold flex items-center gap-1.5"><span class="text-base">⚠</span> Validation Errors Found:</div>
                        <ul class="list-disc list-inside space-y-0.5 font-mono text-[11px] text-red-200">
                            ${result.errors.map(e => `<li>${e}</li>`).join('')}
                        </ul>
                    `;
                }
            }
        } catch (e) {
            if (feedbackEl) {
                feedbackEl.classList.remove('hidden');
                feedbackEl.className = "p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs";
                feedbackEl.innerText = `Error: ${e.message}`;
            }
        }
    }

    async convert() {
        const feedbackEl = document.getElementById('validation-feedback');
        try {
            const targetType = this.machineType === 'moore' ? 'mealy' : 'moore';
            const result = await window.API.convert(this.getMachineJSON(), targetType);

            if (feedbackEl) {
                feedbackEl.classList.remove('hidden');
                feedbackEl.className = "p-3 rounded-xl bg-cyber-accent/15 border border-cyber-accent/40 text-cyan-200 text-xs flex items-center justify-between";
                feedbackEl.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="text-base font-bold text-cyber-accent">⚡</span>
                        <span>Successfully converted to <strong>${targetType.toUpperCase()}</strong> machine (${result.converted_machine.states.length} states)!</span>
                    </div>
                    <span class="text-[11px] text-gray-400 font-mono">${result.steps.length} steps generated</span>
                `;
            }

            // Dispatch event for visualization, steps panel, and batch tester
            window.dispatchEvent(new CustomEvent('machine-converted', { detail: result }));
        } catch (e) {
            if (feedbackEl) {
                feedbackEl.classList.remove('hidden');
                feedbackEl.className = "p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs";
                feedbackEl.innerText = `Conversion Error: ${e.message}`;
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.machineInput = new MachineInput();
});
