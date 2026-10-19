/**
 * Curated library of Automata Theory presets for Moore and Mealy machines.
 * Covers classic examples and edge cases (especially state-splitting).
 */
const PRESETS = {
    state_splitting_demo: {
        id: "state_splitting_demo",
        name: "1. State Splitting Demo (Mealy → Moore)",
        badge: "Edge Case",
        type: "mealy",
        description: "State q1 is reached via both output '0' and output '1'. When converting to Moore, q1 MUST be split into q1_0 and q1_1.",
        states: ["q0", "q1", "q2"],
        inputAlphabet: ["0", "1"],
        outputAlphabet: ["0", "1"],
        initialState: "q0",
        transitions: [
            { from: "q0", input: "0", to: "q1", output: "0" },
            { from: "q0", input: "1", to: "q2", output: "1" },
            { from: "q1", input: "0", to: "q1", output: "1" }, // Self loop receives 1 while q0->q1 receives 0!
            { from: "q1", input: "1", to: "q2", output: "0" },
            { from: "q2", input: "0", to: "q0", output: "1" },
            { from: "q2", input: "1", to: "q1", output: "0" }
        ],
        sampleStrings: ["01011", "00110", "11001", "0100101"]
    },

    ones_complement: {
        id: "ones_complement",
        name: "2. 1's Complement Inverter (Mealy)",
        badge: "Classic",
        type: "mealy",
        description: "Flips every binary bit: 0 becomes 1 and 1 becomes 0. A clean single-state Mealy machine.",
        states: ["q0"],
        inputAlphabet: ["0", "1"],
        outputAlphabet: ["0", "1"],
        initialState: "q0",
        transitions: [
            { from: "q0", input: "0", to: "q0", output: "1" },
            { from: "q0", input: "1", to: "q0", output: "0" }
        ],
        sampleStrings: ["101011", "0000", "1111", "010101"]
    },

    twos_complement: {
        id: "twos_complement",
        name: "3. 2's Complement Generator (Mealy)",
        badge: "Arithmetic",
        type: "mealy",
        description: "Computes 2's complement of a binary number (LSB to MSB): Copies bits up to and including the first '1', then inverts all subsequent bits.",
        states: ["q0", "q1"],
        inputAlphabet: ["0", "1"],
        outputAlphabet: ["0", "1"],
        initialState: "q0",
        transitions: [
            { from: "q0", input: "0", to: "q0", output: "0" },
            { from: "q0", input: "1", to: "q1", output: "1" },
            { from: "q1", input: "0", to: "q1", output: "1" },
            { from: "q1", input: "1", to: "q1", output: "0" }
        ],
        sampleStrings: ["00101", "1000", "0110", "1101"]
    },

    even_parity: {
        id: "even_parity",
        name: "4. Even Parity Detector (Moore)",
        badge: "Classic",
        type: "moore",
        description: "Outputs '1' whenever an even number of '1's has been read, and '0' otherwise. Moore outputs attached directly to states.",
        states: ["q_even", "q_odd"],
        inputAlphabet: ["0", "1"],
        outputAlphabet: ["0", "1"],
        initialState: "q_even",
        outputs: {
            "q_even": "1",
            "q_odd": "0"
        },
        transitions: [
            { from: "q_even", input: "0", to: "q_even" },
            { from: "q_even", input: "1", to: "q_odd" },
            { from: "q_odd", input: "0", to: "q_odd" },
            { from: "q_odd", input: "1", to: "q_even" }
        ],
        sampleStrings: ["10110", "1100", "111", "0000"]
    },

    sequence_101_detector: {
        id: "sequence_101_detector",
        name: "5. '101' Sequence Detector (Moore)",
        badge: "Detector",
        type: "moore",
        description: "Detects the pattern '101' in a binary stream with overlapping detection. Outputs '1' at state q3 upon pattern recognition.",
        states: ["q0", "q1", "q2", "q3"],
        inputAlphabet: ["0", "1"],
        outputAlphabet: ["0", "1"],
        initialState: "q0",
        outputs: {
            "q0": "0",
            "q1": "0",
            "q2": "0",
            "q3": "1"
        },
        transitions: [
            { from: "q0", input: "0", to: "q0" },
            { from: "q0", input: "1", to: "q1" },
            { from: "q1", input: "0", to: "q2" },
            { from: "q1", input: "1", to: "q1" },
            { from: "q2", input: "0", to: "q0" },
            { from: "q2", input: "1", to: "q3" },
            { from: "q3", input: "0", to: "q2" },
            { from: "q3", input: "1", to: "q1" }
        ],
        sampleStrings: ["10101", "1101011", "00101", "101101"]
    },

    sequence_110_detector: {
        id: "sequence_110_detector",
        name: "6. '110' Sequence Detector (Mealy)",
        badge: "Detector",
        type: "mealy",
        description: "Detects '110' in a stream and emits output '1' exactly on the transition that completes the pattern.",
        states: ["q0", "q1", "q2"],
        inputAlphabet: ["0", "1"],
        outputAlphabet: ["0", "1"],
        initialState: "q0",
        transitions: [
            { from: "q0", input: "0", to: "q0", output: "0" },
            { from: "q0", input: "1", to: "q1", output: "0" },
            { from: "q1", input: "0", to: "q0", output: "0" },
            { from: "q1", input: "1", to: "q2", output: "0" },
            { from: "q2", input: "0", to: "q0", output: "1" }, // Completes '110'!
            { from: "q2", input: "1", to: "q2", output: "0" }
        ],
        sampleStrings: ["110110", "10110", "1110", "01100"]
    },

    modulo_3_counter: {
        id: "modulo_3_counter",
        name: "7. Modulo 3 Binary Remainder (Moore)",
        badge: "Math",
        type: "moore",
        description: "Computes the remainder of a binary stream (MSB to LSB) modulo 3. Remainder 0, 1, or 2 is reflected directly in states.",
        states: ["q0", "q1", "q2"],
        inputAlphabet: ["0", "1"],
        outputAlphabet: ["0", "1", "2"],
        initialState: "q0",
        outputs: {
            "q0": "0",
            "q1": "1",
            "q2": "2"
        },
        transitions: [
            { from: "q0", input: "0", to: "q0" },
            { from: "q0", input: "1", to: "q1" },
            { from: "q1", input: "0", to: "q2" },
            { from: "q1", input: "1", to: "q0" },
            { from: "q2", input: "0", to: "q1" },
            { from: "q2", input: "1", to: "q2" }
        ],
        sampleStrings: ["110", "1001", "1010", "1111"] // 6%3=0, 9%3=0, 10%3=1, 15%3=0
    }
};

window.PRESETS = PRESETS;
