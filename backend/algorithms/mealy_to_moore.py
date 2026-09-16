def mealy_to_moore_algorithm(states: list, alphabet: list, transitions: list, initial_state: str, output_alphabet: list) -> dict:
    """
    Core mathematical algorithm for Mealy -> Moore conversion (State Splitting).
    """
    # 1. Identify incoming outputs for each state
    # incoming_outputs[state] = set(outputs)
    incoming_outputs = {s: set() for s in states}
    for t in transitions:
        incoming_outputs[t['to']].add(t['output'])
        
    moore_states = []
    moore_outputs = {}
    state_mapping = {} # Maps original state -> list of split states
    
    # 2 & 3. Create Split States and Assign Outputs
    for s in states:
        used_outputs = sorted(list(incoming_outputs[s]))
        
        if not used_outputs:
            # Tricky Case: State has no incoming transitions.
            # Assign default output (first in alphabet) to prevent crash
            default_out = output_alphabet[0] if output_alphabet else "0"
            new_state_name = f"{s}_{default_out}"
            moore_states.append(new_state_name)
            moore_outputs[new_state_name] = default_out
            state_mapping[s] = [new_state_name]
        else:
            state_mapping[s] = []
            for out_val in used_outputs:
                new_state_name = f"{s}_{out_val}"
                moore_states.append(new_state_name)
                moore_outputs[new_state_name] = out_val
                state_mapping[s].append(new_state_name)
                
    # 4. Reconstruct Transitions
    moore_transitions = []
    for t in transitions:
        src = t['from']
        symbol = t['input']
        dest = t['to']
        out_val = t['output']
        
        dest_split_state = f"{dest}_{out_val}"
        
        # The transition must originate from EVERY split variant of the source state
        for src_split_state in state_mapping[src]:
            moore_transitions.append({
                'from': src_split_state,
                'input': symbol,
                'to': dest_split_state
            })
            
    # 5. Determine Initial State
    # Tricky Case: If initial state was split, pick the lowest lexicographical one deterministically
    moore_initial_state = state_mapping[initial_state][0]
    
    return {
        'type': 'moore',
        'states': moore_states,
        'alphabet': alphabet.copy(),
        'initialState': moore_initial_state,
        'outputs': moore_outputs,
        'transitions': moore_transitions
    }
