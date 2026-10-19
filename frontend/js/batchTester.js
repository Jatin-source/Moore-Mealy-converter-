/**
 * Equivalence & Batch Testing Manager
 * Implements Section 11 of the Automata Theory course specification.
 * Automatically tests original and converted machines side-by-side,
 * demonstrating output alignment and equivalence verification.
 */
class BatchTester {
    constructor() {
        this.originalMachine = null;
        this.convertedMachine = null;
        this.testResults = [];
        this.initDOM();
    }

    initDOM() {
        const btnRun = document.getElementById('btn-run-batch-test');
        if (btnRun) {
            btnRun.addEventListener('click', () => this.runTestSuite());
        }

        const btnAddCustom = document.getElementById('btn-add-custom-test');
        if (btnAddCustom) {
            btnAddCustom.addEventListener('click', () => this.addCustomStringAndTest());
        }

        const btnRandom5 = document.getElementById('btn-random-5-tests');
        if (btnRandom5) {
            btnRandom5.addEventListener('click', () => this.generateRandomTestsAndRun());
        }

        // Listen for conversion events to update active machines
        window.addEventListener('machine-converted', (e) => {
            this.convertedMachine = e.detail.converted_machine;
            this.originalMachine = window.machineInput ? window.machineInput.getMachineJSON() : null;
            this.updateUIStatus();
        });
    }

    updateUIStatus() {
        const container = document.getElementById('batch-test-container');
        if (!container) return;

        if (!this.convertedMachine) {
            container.innerHTML = `
                <div class="text-center py-6 text-gray-400">
                    <p class="text-sm">Convert a machine above first to unlock automated equivalence testing.</p>
                </div>
            `;
            return;
        }

        // Automatically run initial equivalence test using sample strings or defaults
        this.runTestSuite();
    }

    getDefaultStrings() {
        // Collect samples from current preset or generate standard binary inputs
        if (window.machineInput && window.machineInput.currentPresetId && window.PRESETS[window.machineInput.currentPresetId]) {
            return [...window.PRESETS[window.machineInput.currentPresetId].sampleStrings];
        }
        return ["0", "1", "00", "01", "10", "11", "101", "110", "101101"];
    }

    async runTestSuite(customList = null) {
        if (!this.originalMachine || !this.convertedMachine) {
            alert("Please convert the machine first before running equivalence testing.");
            return;
        }

        const stringsToTest = customList || this.getDefaultStrings();
        const container = document.getElementById('batch-test-container');
        if (container) {
            container.innerHTML = `
                <div class="flex items-center justify-center py-8 text-cyber-accent animate-pulse font-mono text-sm">
                    Running equivalence verification on ${stringsToTest.length} test expressions...
                </div>
            `;
        }

        try {
            const data = await window.API.batchTest(this.originalMachine, this.convertedMachine, stringsToTest);
            this.renderResults(data);
        } catch (err) {
            if (container) {
                container.innerHTML = `<div class="p-4 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-sm">Testing Failed: ${err.message}</div>`;
            }
        }
    }

    generateRandomTestsAndRun() {
        if (!this.originalMachine) return;
        const alphabet = this.originalMachine.alphabet || ["0", "1"];
        const randomStrings = [];
        
        for (let i = 0; i < 6; i++) {
            const length = Math.floor(Math.random() * 5) + 3; // length 3 to 7
            let str = "";
            for (let j = 0; j < length; j++) {
                str += alphabet[Math.floor(Math.random() * alphabet.length)];
            }
            randomStrings.push(str);
        }

        this.runTestSuite(randomStrings);
    }

    addCustomStringAndTest() {
        const input = document.getElementById('custom-batch-string-input');
        if (!input) return;
        const val = input.value.trim();
        if (!val) {
            alert("Please enter one or more comma-separated strings to test.");
            return;
        }
        const tokens = val.split(',').map(s => s.trim()).filter(Boolean);
        this.runTestSuite(tokens);
    }

    renderResults(report) {
        const container = document.getElementById('batch-test-container');
        if (!container) return;

        const allMatched = report.all_matched;
        const passBadgeClass = allMatched ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-red-500/20 text-red-400 border-red-500/40";
        const passText = allMatched ? `✓ ${report.passed}/${report.total} Test Cases Matched (100% Equivalent)` : `⚠ ${report.passed}/${report.total} Matched`;

        let rowsHtml = report.results.map((r, idx) => `
            <tr class="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                <td class="px-4 py-2 font-mono text-cyan-300">${r.input_string === "" ? 'ε (empty)' : r.input_string}</td>
                <td class="px-4 py-2 font-mono text-gray-300">${r.original_output || '—'}</td>
                <td class="px-4 py-2 font-mono text-purple-300">${r.converted_output || '—'}</td>
                <td class="px-4 py-2 font-mono text-emerald-300">${r.aligned_original}</td>
                <td class="px-4 py-2 font-semibold ${r.match ? 'text-emerald-400' : 'text-red-400'}">
                    ${r.match ? '<span class="inline-flex items-center gap-1">✓ MATCH</span>' : '<span class="inline-flex items-center gap-1">✗ MISMATCH</span>'}
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="space-y-4">
                <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-gray-900/60 border border-gray-700/60">
                    <div class="flex items-center gap-2">
                        <span class="px-3 py-1 rounded-full text-xs font-bold border ${passBadgeClass}">${passText}</span>
                        <span class="text-xs text-gray-400">Convention: Moore's leading q₀ output excluded in alignment.</span>
                    </div>
                    <div class="flex gap-2">
                        <button id="btn-rerun-sample" class="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 rounded border border-gray-600 transition">Sample Tests</button>
                        <button id="btn-rerun-random" class="px-3 py-1 text-xs bg-cyber-accent/20 hover:bg-cyber-accent/30 text-cyber-accent rounded border border-cyber-accent/40 transition">🎲 Random 6</button>
                    </div>
                </div>

                <div class="overflow-x-auto max-h-60 rounded-xl border border-gray-800 bg-gray-900/40">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-gray-800/70 text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-700">
                            <tr>
                                <th class="px-4 py-2">Input Expression</th>
                                <th class="px-4 py-2">Original Output</th>
                                <th class="px-4 py-2">Converted Output</th>
                                <th class="px-4 py-2">Aligned Output</th>
                                <th class="px-4 py-2">Verification</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('btn-rerun-sample')?.addEventListener('click', () => this.runTestSuite());
        document.getElementById('btn-rerun-random')?.addEventListener('click', () => this.generateRandomTestsAndRun());
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.batchTester = new BatchTester();
});
