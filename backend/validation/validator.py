from typing import List, Union
from backend.models.moore_machine import MooreMachine
from backend.models.mealy_machine import MealyMachine

def validate_machine(machine: Union[MooreMachine, MealyMachine]) -> List[str]:
    """
    Validates a machine against Automata Theory rules.
    Returns a list of error messages. If empty, the machine is valid.
    """
    errors = []
    
    # 1. Empty machine
    if not machine.states:
        errors.append("Machine has no states.")
        return errors # Fatal, stop here
        
    state_names = [s.name for s in machine.states]
    
    # 2. Duplicate states
    if len(set(state_names)) != len(state_names):
        errors.append("Duplicate states detected.")
        
    # 3. Missing or invalid initial state
    if not machine.initial_state or machine.initial_state.name not in state_names:
        errors.append(f"Initial state '{machine.initial_state}' is not in the set of states.")
        
    # 4. Input / Output alphabets
    if not machine.input_alphabet:
        errors.append("Input alphabet is empty.")
    if not machine.output_alphabet:
        errors.append("Output alphabet is empty.")

    # 5. Transition validation
    transition_map = {}
    for t in machine.transitions:
        # Invalid state references
        if t.from_state.name not in state_names:
            errors.append(f"Transition references unknown source state '{t.from_state.name}'.")
        if t.to_state.name not in state_names:
            errors.append(f"Transition references unknown destination state '{t.to_state.name}'.")
            
        # Invalid input symbols
        if t.input_symbol not in machine.input_alphabet:
            errors.append(f"Transition uses input symbol '{t.input_symbol}' not in alphabet.")
            
        # Duplicate transitions (Non-determinism)
        key = (t.from_state.name, t.input_symbol)
        if key in transition_map:
            errors.append(f"Non-deterministic transition detected for state '{t.from_state.name}' on input '{t.input_symbol}'.")
        transition_map[key] = True
        
        # Mealy-specific: Missing/Invalid output
        if machine.type == 'mealy':
            if not t.output_symbol:
                errors.append(f"Mealy transition {t.from_state.name} --{t.input_symbol}--> lacks an output symbol.")
            elif t.output_symbol not in machine.output_alphabet:
                errors.append(f"Mealy transition output '{t.output_symbol}' is not in the output alphabet.")

    # 6. Missing transitions (Must be a complete DFA)
    for s in state_names:
        for a in machine.input_alphabet:
            if (s, a) not in transition_map:
                errors.append(f"Missing transition: State '{s}' has no transition for input '{a}'.")

    # 7. Moore-specific: State outputs
    if machine.type == 'moore':
        for s in state_names:
            # Note: We rely on the raw string names for dictionary lookups in outputs
            # Depending on JSON serialization, output keys might be state names
            # Let's ensure every state name has an output
            output_found = False
            for moore_state, out_val in machine.outputs.items():
                if moore_state.name == s:
                    output_found = True
                    if out_val not in machine.output_alphabet:
                        errors.append(f"Moore state '{s}' has output '{out_val}' not in the output alphabet.")
                    break
            if not output_found:
                errors.append(f"Moore state '{s}' has no assigned output.")

    return errors
