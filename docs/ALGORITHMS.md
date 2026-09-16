# Mathematical Algorithms & Tricky Cases

This document nails down the precise theoretical conversions implemented in the simulator.

## 1. Moore → Mealy Conversion
**Input**: Moore Machine $M_{moore} = (Q, \Sigma, \Delta, \delta, \lambda, q_0)$
**Output**: Mealy Machine $M_{mealy} = (Q', \Sigma, \Delta, \delta', \lambda', q_0')$

**Mathematical Mapping**:
- $Q' = Q$ (States are identical)
- $q_0' = q_0$ (Initial state is identical)
- $\delta' = \delta$ (Transitions remain the same)
- **Output Function** $\lambda'(q_i, a) = \lambda(\delta(q_i, a))$
  *(The Mealy output on a transition is the Moore output of the destination state).*

**Tricky Cases Flagged**:
1.  **Initial Output Alignment**: A Moore machine outputs $\lambda(q_0)$ *before* any input is read. A Mealy machine only outputs upon reading an input. 
    *   *Resolution*: We establish a strict **output-alignment convention**. The simulator will explicitly ignore the zero-th output of the Moore machine during automated string comparison to ensure strings match 1:1.

## 2. Mealy → Moore Conversion
**Input**: Mealy Machine $M_{mealy} = (Q, \Sigma, \Delta, \delta, \lambda, q_0)$
**Output**: Moore Machine $M_{moore} = (Q', \Sigma, \Delta, \delta', \lambda', q_0')$

**Mathematical Mapping (State Splitting)**:
1.  **Identify Incoming Outputs**: For every state $q \in Q$, find the set of outputs on all incoming transitions: 
    $O_q = \{ \lambda(p, a) \mid \delta(p, a) = q \text{ for some } p \in Q, a \in \Sigma \}$
2.  **Create Split States**: 
    - If $O_q$ is empty (e.g., an initial state with no incoming transitions), create a single state $q_{default}$ and assign it a default output (we will deterministically pick the first symbol in the output alphabet $\Delta$).
    - Otherwise, for each output $o \in O_q$, create a new Moore state named $q\_o \in Q'$.
3.  **Assign Moore Outputs**: For each new state $q\_o$, set $\lambda'(q\_o) = o$.
4.  **Reconstruct Transitions**: For every original transition $\delta(p, a) = q$ with output $\lambda(p, a) = o_{out}$:
    - Find all split variants of the source state $p$ (i.e., $p\_x \in Q'$).
    - For *each* variant $p\_x$, create a transition: $\delta'(p\_x, a) = q\_o_{out}$.
5.  **Determine Initial State**:
    - If $q_0$ had no incoming transitions, $q_0'$ is $q_{0\_default}$.
    - If $q_0$ had incoming transitions, $q_0$ was split into multiple states ($q_{0\_0}, q_{0\_1}$, etc.). We will designate the initial state $q_0'$ as the split state corresponding to the lowest lexicographical output value to remain deterministic.

**Tricky Cases Flagged**:
1.  **Self-Loops during Splitting**: If a state $q_1$ has a self-loop $q_1 \xrightarrow{a/0} q_1$ and $q_1 \xrightarrow{b/1} q_1$, it splits into $q_{1\_0}$ and $q_{1\_1}$. The loop transitions must dynamically route from *both* split source states to the correct split destination state depending on the transition output.
2.  **Unreachable States**: If a state has no incoming transitions (and isn't the initial state), $O_q$ is empty.
    *   *Resolution*: The algorithm safely ignores them or assigns a default output, though typically unreachable states should be pruned. We will keep them and assign a default output to avoid deleting user data.
3.  **Lexicographical Sorting of States**: States named `q10` might sort before `q2`. 
    *   *Resolution*: We must implement natural sorting in the Python backend so the UI renders steps in a logical sequence.
