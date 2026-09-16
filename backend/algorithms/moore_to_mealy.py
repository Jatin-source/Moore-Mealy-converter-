from typing import Tuple, List, Dict, Any
from backend.models.moore_machine import MooreMachine
from backend.models.mealy_machine import MealyMachine
from backend.models.transition import Transition

def convert_moore_to_mealy(machine: MooreMachine) -> Tuple[MealyMachine, List[Dict[str, Any]]]:
    """
    Converts a MooreMachine dataclass into a MealyMachine dataclass.
    Returns the converted machine and a list of animation steps for the frontend.
    """
    steps = []
    steps.append({
        "step": 1,
        "description": "Read original Moore machine. State count is preserved.",
        "highlight_nodes": [s.name for s in machine.states],
        "highlight_edges": []
    })
    
    mealy_transitions = []
    
    for idx, t in enumerate(machine.transitions):
        # λ'(src, symbol) = λ(dest)
        output_val = machine.outputs.get(t.to_state)
        
        mealy_transitions.append(Transition(
            from_state=t.from_state,
            input_symbol=t.input_symbol,
            to_state=t.to_state,
            output_symbol=output_val
        ))
        
        steps.append({
            "step": idx + 2,
            "description": f"Process transition: {t.from_state} --{t.input_symbol}--> {t.to_state}. "
                           f"Moore output at {t.to_state} is '{output_val}', so Mealy output becomes '{output_val}'.",
            "highlight_nodes": [t.to_state.name],
            "highlight_edges": [f"{t.from_state.name}-{t.input_symbol}-{t.to_state.name}"]
        })
        
    output_alphabet = list(set(machine.outputs.values()))
        
    mealy_machine = MealyMachine(
        states=machine.states.copy(),
        input_alphabet=machine.input_alphabet.copy(),
        output_alphabet=output_alphabet,
        initial_state=machine.initial_state,
        transitions=mealy_transitions
    )
    
    steps.append({
        "step": len(machine.transitions) + 2,
        "description": "Final converted Mealy machine generated.",
        "highlight_nodes": [],
        "highlight_edges": []
    })
    
    return mealy_machine, steps
