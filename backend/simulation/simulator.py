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

def verify_equivalence(machine_a: Union[MooreMachine, MealyMachine], machine_b: Union[MooreMachine, MealyMachine], test_strings: list[str]) -> Dict[str, Any]:
    """
    Verifies equivalence between two machines across multiple test strings,
    adhering to the Automata Theory Moore-Mealy Output Alignment Convention.
    """
    results = []
    passed = 0
    
    for s in test_strings:
        res_a = simulate_machine(machine_a, s)
        res_b = simulate_machine(machine_b, s)
        
        out_a = res_a["output_string"]
        out_b = res_b["output_string"]
        
        # Determine alignment based on machine types
        if machine_a.type == 'moore' and machine_b.type == 'mealy':
            aligned_a = out_a[1:] if len(out_a) > 0 else ""
            aligned_b = out_b
            convention_note = f"Moore initial output '{out_a[:1]}' omitted from aligned comparison."
        elif machine_a.type == 'mealy' and machine_b.type == 'moore':
            aligned_a = out_a
            aligned_b = out_b[1:] if len(out_b) > 0 else ""
            convention_note = f"Moore initial output '{out_b[:1]}' omitted from aligned comparison."
        else:
            aligned_a = out_a
            aligned_b = out_b
            convention_note = "Direct 1:1 comparison (identical machine architectures)."
            
        is_match = (aligned_a == aligned_b)
        if is_match:
            passed += 1
            
        results.append({
            "input_string": s,
            "original_output": out_a,
            "converted_output": out_b,
            "aligned_original": aligned_a,
            "aligned_converted": aligned_b,
            "match": is_match,
            "convention_note": convention_note
        })
        
    return {
        "results": results,
        "total": len(test_strings),
        "passed": passed,
        "all_matched": (passed == len(test_strings)),
        "convention": "Moore machine emits an initial output at q0 before input arrives; this leading symbol is excluded in aligned equivalence testing."
    }

