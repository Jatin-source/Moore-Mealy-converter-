# Moore ↔ Mealy Machine Simulator

A premium, interactive Automata Theory simulator designed to convert and visualize Moore and Mealy machines.

## Theoretical Features
- **Moore → Mealy Conversion**: Lossless, exact output mapping on transitions.
- **Mealy → Moore Conversion**: Advanced state-splitting algorithm. Deterministically resolves incoming outputs and duplicates transitions seamlessly.
- **String Simulation**: Steps through test strings to prove equivalence between the original and converted machines. Accounts for the Moore zero-th state output alignment convention.
- **Rigorous Validation**: Rejects invalid, empty, or non-deterministic machines, trapping edge-case errors before simulation.

## Technical Architecture
- **Backend**: Python 3.10+ (Flask, Pytest). Pure Python dataclasses handle the Automata logic flawlessly.
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript. Zero-build architecture.
- **Animation Engine**: **GSAP** powers fluid UI transitions, while **D3.js** renders the state machines as interactive, force-directed SVG graphs.

## How to Run

1. **Install Requirements**:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Run the Server**:
   ```bash
   python backend/app.py
   ```

3. **Open the App**:
   Navigate to `http://localhost:5000` in your browser.

## How to Test
The backend logic is rigorously tested using `pytest`.
```bash
pytest backend/tests/
```

## Team Viva Guide
- **Why no React/Node.js?**: To ensure the simulator is incredibly easy to run and explain locally. A single Python Flask process statically serves the CDN-linked Tailwind/D3 frontend. 
- **How does state splitting work?**: `mealy_to_moore.py` calculates the set of all unique incoming output symbols for every state. If a state has multiple incoming outputs (e.g. `0` and `1`), it creates distinct states (e.g. `q1_0`, `q1_1`) and perfectly duplicates the outgoing transitions for each new split state.
