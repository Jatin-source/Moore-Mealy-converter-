from typing import Dict, Any, Union
from backend.models.moore_machine import MooreMachine
from backend.models.mealy_machine import MealyMachine
from backend.models.state import State

def simulate_machine(machine: Union[MooreMachine, MealyMachine], input_string: str) -> Dict[str, Any]:
    """
    Simulates a string over the given machine.
    Returns the path taken, the output sequence, and the final state.
    """
    current_state = machine.initial_state
    path = []
    output_sequence = []
    
    # 1. Output-Alignment Convention:
    # A Moore machine emits an output before reading any input.
    if machine.type == 'moore':
        initial_out = next((v for k, v in machine.outputs.items() if k.name == current_state.name), "")
        output_sequence.append(initial_out)
        path.append({
            "step": 0,
            "input": "",
            "state": current_state.name,
            "output": initial_out,
            "transition": None
        })

    # Optimize transition lookups: (state_name, input_symbol) -> Transition object
    t_map = { (t.from_state.name, t.input_symbol): t for t in machine.transitions }

    # 2. Process the string step-by-step
    for idx, symbol in enumerate(input_string):
        if symbol not in machine.input_alphabet:
            raise ValueError(f"Input symbol '{symbol}' is not in the machine's alphabet.")
            
        transition = t_map.get((current_state.name, symbol))
        if not transition:
            raise ValueError(f"Machine crashed: No transition defined for state '{current_state.name}' on input '{symbol}'.")
            
        next_state = transition.to_state
        
        # Determine output based on machine type
        if machine.type == 'mealy':
            step_out = transition.output_symbol
        else: # Moore
            step_out = next((v for k, v in machine.outputs.items() if k.name == next_state.name), "")
            
        output_sequence.append(step_out)
        
        path.append({
            "step": idx + 1,
            "input": symbol,
            "state": next_state.name,
            "output": step_out,
            "transition": f"{current_state.name}-{symbol}-{next_state.name}"
        })
        
        current_state = next_state
        
    return {
        "input_string": input_string,
        "output_string": "".join(output_sequence),
        "path": path,
        "final_state": current_state.name
    }
