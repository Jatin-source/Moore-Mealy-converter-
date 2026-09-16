# Phase 0: Project Proposal — Moore ↔ Mealy Machine Simulator

## 1. Architecture & Tech Stack
- **Core Algorithm Engine**: Python 3.10+ using a clean modular architecture (dataclasses, type hints).
- **Frontend**: HTML5, CSS3, Vanilla JavaScript. Interactive SVG state diagrams.
- **Integration**: Flask (Python).
  - *Justification*: We will serve the frontend statically directly from Flask (`app.py` serving `index.html` from a `static`/`templates` folder). This ensures there is only **one process to run** (`python app.py`) with no complex JS build pipelines (no Node/NPM required). This is the most reliable, easily explainable setup for a college viva.

## 2. Full Feature List
- Bi-directional conversion: Moore → Mealy and Mealy → Moore.
- Interactive, responsive, dynamically-generated SVG state machine visualizations.
- Interactive transition and output table editing.
- Step-by-step conversion visualization panel (animates algorithm steps).
- String simulation with animated state execution.
- Original vs. Converted comparison view.
- Automated equivalence testing (manual, random, batch strings).
- Strict validation rules with informative error messages (rejecting invalid machines).
- Built-in educational theory section ("About Conversion").
- "Demo Example" button for one-click complex state-splitting demonstration.

## 3. UI Wireframe
```text
HEADER
"Moore ↔ Mealy Machine Simulator"

MACHINE TYPE
[ Moore → Mealy ]   [ Mealy → Moore ]

INPUT MACHINE
  States: [q0] [q1] [q2] [+ Add State]
  Input Alphabet: [0] [1] [+ Add]
  Output Alphabet: [0] [1] [+ Add]
  Initial State: [q0 ▾]

TRANSITION / OUTPUT TABLE   (dynamic, editable)

[ VALIDATE MACHINE ]
[ CONVERT ]

CONVERSION STEPS
  Step 1 / Step 2 / Step 3 / ...
  [Previous] [Play] [Pause] [Next]

VISUALIZATION
  Original Machine   →   Converted Machine   (interactive SVG diagrams)

STRING SIMULATOR
  Input: [ 101101 ]
  [Step] [Play] [Pause] [Reset]
  Current State: q1 | Current Input: 1 | Output: 0

VALIDATION
  Input | Original | Converted | Result   (table of test cases)
```

## 4. Python Project Structure
```text
backend/
  app.py
  requirements.txt
  models/
    __init__.py, state.py, transition.py, moore_machine.py, mealy_machine.py
  algorithms/
    __init__.py, moore_to_mealy.py, mealy_to_moore.py
  simulation/
    __init__.py, simulator.py
  validation/
    __init__.py, validator.py
  serialization/
    __init__.py, json_serializer.py
  tests/
    __init__.py, test_moore_to_mealy.py, test_mealy_to_moore.py, test_simulator.py, test_validator.py
frontend/
  index.html
  css/style.css
  js/
    app.js, machineInput.js, visualization.js, conversionSteps.js, simulator.js, validation.js, api.js
```

## 5. JSON / Data Model
**Mealy Machine:**
```json
{
  "type": "mealy",
  "states": ["q0", "q1"],
  "alphabet": ["0", "1"],
  "initialState": "q0",
  "transitions": [
    { "from": "q0", "input": "0", "to": "q1", "output": "1" }
  ]
}
```
**Moore Machine:**
```json
{
  "type": "moore",
  "states": ["q0", "q1"],
  "alphabet": ["0", "1"],
  "initialState": "q0",
  "outputs": { "q0": "0", "q1": "1" },
  "transitions": [
    { "from": "q0", "input": "0", "to": "q1" }
  ]
}
```

## 6. Algorithms
**Moore → Mealy:**
- For every transition `q_i --a--> q_j`, the Mealy output on that transition becomes `λ_Moore(q_j)`.
- State count is exactly preserved.

**Mealy → Moore (State Splitting):**
- Find all `(destination_state, incoming_output)` pairs used in transitions.
- Create one Moore state per pair (e.g., `q1_0`, `q1_1`).
- Reconstruct transitions linking to the appropriately split states.
- Handle `initialState` defaults explicitly if it has no incoming transitions.

## 7. Step-by-step Visualization Strategy
- The Python API will return a `steps` array along with the final converted machine.
- Each step object will contain a description and the specific `highlight_nodes`/`highlight_edges`.
- The JS frontend will use these steps to walk through the logic, updating the SVG DOM classes (e.g., `.active`, `.processing`) to highlight the relevant parts of the diagram during playback.

## 8. Equivalence-Testing Strategy
- We will establish an explicit **Output-Alignment Convention**: Moore machines output a pre-input value at the initial state. The simulator will drop the first character of the Moore output string (or visually separate it) to align it perfectly with the Mealy output string for 1:1 validation.
- Provide manual string entry, random string generation, and batch string processing.

## 9. Edge Cases to Handle
- Single-state machines, self-loops, multiple transitions to the same state.
- **Headline edge case:** Same destination state reached with different Mealy outputs (forces state splitting).
- Unreachable states, missing transitions, multiple inputs/outputs (e.g., binary).
- Stress testing (larger machines).
- State names like `q0, q1, q10` (custom sorting algorithm to prevent `q10` appearing before `q2`).

## 10. Testing Strategy (Pytest)
- Complete coverage of basic cases and all identified edge cases.
- Validation logic testing (verifying that invalid machines are cleanly rejected with proper messages).
- Simulation correctness testing.

## 11. Live-Demo Strategy
- A dedicated button will pre-load a Mealy machine explicitly designed to require state-splitting (e.g., `q1` reached via outputs `0` and `1`).
- We will click through validation, conversion, step-by-step walk-through, simulate a string, and run batch validations to prove equivalence live.

## 12. Suggested 5-Member Task Division
1. **Member 1**: Python models + core conversion algorithms.
2. **Member 2**: Validation, simulation engine, pytest suite, JSON serialization.
3. **Member 3**: Frontend machine input UI, transition table, SVG state-diagram rendering.
4. **Member 4**: Frontend conversion-steps panel, string simulator, comparison view.
5. **Member 5**: Flask integration, equivalence-testing UI, demo mode, documentation.

## 13. Development Phases
- **Phase 0**: Proposal & Architecture (Current)
- **Phase 1**: Analyze requirements, finalize architecture.
- **Phase 2**: Nail down mathematical algorithms; flag tricky cases.
- **Phase 3**: Design Python data classes and API contract.
- **Phase 4**: Implement Moore → Mealy.
- **Phase 5**: Implement Mealy → Moore (incl. state splitting).
- **Phase 6**: Implement simulation + validation.
- **Phase 7**: Implement frontend shell.
- **Phase 8**: Implement SVG visualization.
- **Phase 9**: Connect frontend and backend.
- **Phase 10**: Add test cases and demo mode.
- **Phase 11**: Full review pass.
