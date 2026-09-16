def moore_to_mealy_algorithm(states: list, alphabet: list, transitions: list, outputs: dict, initial_state: str) -> dict:
    """
    Core mathematical algorithm for Moore -> Mealy conversion.
    Isolated from data classes to test pure logic (Phase 2).
    
    Rule: For every transition (src, symbol) -> dest, 
    the Mealy output is the Moore output of the 'dest' state.
    """
    mealy_transitions = []
    
    for t in transitions:
        src = t['from']
        symbol = t['input']
        dest = t['to']
        
        # λ'(src, symbol) = λ(dest)
        output_val = outputs.get(dest)
        
        mealy_transitions.append({
            'from': src,
            'input': symbol,
            'to': dest,
            'output': output_val
        })
        
    return {
        'type': 'mealy',
        'states': states.copy(),
        'alphabet': alphabet.copy(),
        'initialState': initial_state,
        'transitions': mealy_transitions
    }
