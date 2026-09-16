from typing import Tuple, List, Dict, Any
from backend.models.mealy_machine import MealyMachine
from backend.models.moore_machine import MooreMachine
from backend.models.transition import Transition
from backend.models.state import State

def convert_mealy_to_moore(machine: MealyMachine) -> Tuple[MooreMachine, List[Dict[str, Any]]]:
    """
    Converts a MealyMachine dataclass into a MooreMachine dataclass.
    Handles complex state splitting and yields animation steps.
    """
    steps = []
    steps.append({
        "step": 1,
        "description": "Read original Mealy machine. Scanning transitions for destination-state/output pairs.",
        "highlight_nodes": [s.name for s in machine.states],
        "highlight_edges": []
    })
    
    # 1. Identify incoming outputs for each state
    incoming_outputs = {s.name: set() for s in machine.states}
    for t in machine.transitions:
        incoming_outputs[t.to_state.name].add(t.output_symbol)
        
    moore_states = []
    moore_outputs = {}
    state_mapping = {} # Maps original state name -> list of split state names
    
    # 2 & 3. Create Split States and Assign Outputs
    step_idx = 2
    for s in machine.states:
        used_outputs = sorted(list(incoming_outputs[s.name]))
        
        if not used_outputs:
            # Tricky Case: State has no incoming transitions (e.g. initial state)
            default_out = machine.output_alphabet[0] if machine.output_alphabet else "0"
            new_state_name = f"{s.name}_{default_out}"
            moore_states.append(State(new_state_name))
            moore_outputs[State(new_state_name)] = default_out
            state_mapping[s.name] = [new_state_name]
            
            steps.append({
                "step": step_idx,
                "description": f"State '{s.name}' has no incoming transitions. Created default Moore state '{new_state_name}' with output '{default_out}'.",
                "highlight_nodes": [s.name],
                "highlight_edges": []
            })
        else:
            state_mapping[s.name] = []
            for out_val in used_outputs:
                new_state_name = f"{s.name}_{out_val}"
                moore_states.append(State(new_state_name))
                moore_outputs[State(new_state_name)] = out_val
                state_mapping[s.name].append(new_state_name)
                
            steps.append({
                "step": step_idx,
                "description": f"State '{s.name}' is reached via outputs: {used_outputs}. Split into: {state_mapping[s.name]}.",
                "highlight_nodes": [s.name],
                "highlight_edges": []
            })
        step_idx += 1
                
    # 4. Reconstruct Transitions
    moore_transitions = []
    for t in machine.transitions:
        src = t.from_state.name
        symbol = t.input_symbol
        dest = t.to_state.name
        out_val = t.output_symbol
        
        dest_split_state = State(f"{dest}_{out_val}")
        
        # The transition must originate from EVERY split variant of the source state
        for src_split_name in state_mapping[src]:
            src_split_state = State(src_split_name)
            moore_transitions.append(Transition(
                from_state=src_split_state,
                input_symbol=symbol,
                to_state=dest_split_state
            ))
            
            steps.append({
                "step": step_idx,
                "description": f"Routed transition {src_split_name} --{symbol}--> {dest_split_state.name} (handling output '{out_val}').",
                "highlight_nodes": [src_split_name, dest_split_state.name],
                "highlight_edges": []
            })
            step_idx += 1
            
    # 5. Determine Initial State
    # Tricky Case: If initial state was split, pick the lowest lexicographical one deterministically
    moore_initial_state = State(state_mapping[machine.initial_state.name][0])
    
    moore_machine = MooreMachine(
        states=moore_states,
        input_alphabet=machine.input_alphabet.copy(),
        output_alphabet=machine.output_alphabet.copy(),
        initial_state=moore_initial_state,
        outputs=moore_outputs,
        transitions=moore_transitions
    )
    
    steps.append({
        "step": step_idx,
        "description": "Final converted Moore machine generated.",
        "highlight_nodes": [],
        "highlight_edges": []
    })
    
    return moore_machine, steps
