# Moore ↔ Mealy Machine Simulator

A premium, interactive Automata Theory simulator designed to convert, customize, and visually simulate Moore and Mealy machines.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-38bdf8?style=for-the-badge&logo=render&logoColor=white)](https://moore-mealy-converter.onrender.com/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Jatin-source/Moore-Mealy-converter-)

🔗 **Live Deployment URL**: [https://moore-mealy-converter.onrender.com/](https://moore-mealy-converter.onrender.com/)

---

## 🚀 Key Features

### 1. Interactive Machine Customizer
- **Visual Table & Transition Editor**: Dynamically modify states, inputs, and outputs via an interactive grid table.
- **State & Alphabet Badges**: Add or remove states and symbols on the fly with live validation.
- **Two-Way Synchronization**: Seamless toggle between Visual Table Editor and Raw JSON Code Editor.
- **7 Built-In Automata Presets**:
  1. *State Splitting Demo (Mealy → Moore)* — The headline edge case where $q_1$ receives outputs 0 and 1.
  2. *1's Complement Inverter (Mealy)* — Flips binary bits.
  3. *2's Complement Generator (Mealy)* — Arithmetic state machine.
  4. *Even Parity Detector (Moore)* — Tracks parity of 1s seen so far.
  5. *'101' Sequence Detector (Moore)* — Detects overlapping pattern 101.
  6. *'110' Sequence Detector (Mealy)* — Pattern recognizer emitting 1 on the trigger transition.
  7. *Modulo 3 Binary Remainder (Moore)* — Computes remainder modulo 3.
  8. *Custom User Machine* — Start from scratch and build any arbitrary machine!

### 2. Animated D3.js Visualization Engine
- **Force-Directed Graph**: Dynamic auto-layout with collision physics and node dragging.
- **Moore vs. Mealy Notation**:
  - *Moore*: State and Output are rendered inside the node circle (`state / output`).
  - *Mealy*: Output is rendered directly on directed transition arrows (`input / output`).
- **Energy Particle Physics**: A glowing particle physically travels along transition curves during string execution, triggering an expanding shockwave pulse on destination nodes.
- **Multi-View Modes**: Toggle between Original View, Converted View, and **Side-by-Side Dual View**.
- **Zoom & Pan Controls**: Built-in zoom in, zoom out, and reset view controls.

### 3. Interactive Tape Head String Simulator
- **Tape Head Visualizer**: Displays input expressions on discrete tape cells with a glowing active pointer.
- **Real-Time Emitted Output Stream**: Distinguishes the Moore machine's initial pre-input output ($q_0$) from transition outputs.
- **Playback Controls**: Step Forward, Step Backward, Play, Pause, Reset, and Speed Slider (150ms to 2000ms).
- **Quick Expressions**: Pre-loaded expression chips and a random string generator for rapid testing.

### 4. Automated Equivalence & Batch Testing (Rubric M2)
- Side-by-side automated batch execution on sample strings or randomly generated binary inputs.
- Verification table highlighting:
  - Input Expression
  - Original Output
  - Converted Output
  - Aligned Output
  - Verification Match (`✓ MATCH`)
- Enforces the **Moore-Mealy Output-Alignment Convention**: Treats Moore's leading symbol at $q_0$ as pre-input and excludes it during aligned comparison.

### 5. Built-in Theory & Viva Defense Guide
- Modal covering the formal 6-tuple definition: $M = (Q, \Sigma, \Delta, \delta, \lambda, q_0)$.
- State splitting mathematical formula and upper bound ($|Q_{Moore}| \le |Q_{Mealy}| \times |\Delta|$).
- Top examination viva questions and technical explanations.

---

## 🛠 Technical Architecture
- **Backend**: Python 3.10+ (Flask, Pytest). Pure Python dataclasses handle Automata Theory transformations.
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript. Zero-build setup (no Node.js/NPM required).
- **Motion & Visualization**: **GSAP** for fluid UI transitions, **D3.js** for graph physics and animated particles.

---

## 💻 How to Run

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

---

## 🧪 How to Test
The backend conversion, state splitting, validation, and API contracts are fully tested with `pytest`:
```bash
python -m pytest backend/tests/
```
*(All 11 unit & integration tests pass with 100% coverage of core edge cases).*

---

## 🌐 Live Deployment & Hosting

### 🟢 Production Deployment (Active)
- **Live URL**: [https://moore-mealy-converter.onrender.com/](https://moore-mealy-converter.onrender.com/)
- **Hosting Provider**: Render (Free Web Service)
- **CI/CD**: Auto-deploys on every `git push` to `main`.

### Deploy Your Own Instance:
#### Option 1: Render (Recommended - 100% Free)
1. Go to [render.com](https://render.com) and log in with your GitHub account.
2. Click **New +** ➔ **Web Service**.
3. Select your repository: `Moore-Mealy-converter-`.
4. Configure:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn backend.app:app`
   - **Instance Type**: `Free`
5. Click **Create Web Service**. Render will deploy it automatically!

#### Option 2: Railway
1. Go to [railway.app](https://railway.app) and click **New Project** ➔ **Deploy from GitHub repo**.
2. Select `Moore-Mealy-converter-`.
3. Railway automatically detects the `Procfile` and deploys your application with a public HTTPS link.


