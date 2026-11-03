from typing import Union, Dict, Any
from backend.models.state import State
from backend.models.transition import Transition
from backend.models.moore_machine import MooreMachine
from backend.models.mealy_machine import MealyMachine

def deserialize_machine(data: Dict[str, Any]) -> Union[MooreMachine, MealyMachine]:
    """Converts a JSON dictionary from the frontend into a Python Dataclass."""
    machine_type = (data.get('type') or '').lower()
    states = [State(s) for s in data.get('states', [])]
    input_alphabet = data.get('alphabet', [])
    initial_state = State(data.get('initialState', ''))
    
    # Check if this machine is a DFA or uses DFA acceptance states
    final_states_list = data.get('finalStates') or data.get('acceptStates')
    is_dfa = (machine_type == 'dfa') or (final_states_list is not None and ('outputs' not in data and 'stateOutputs' not in data))
    
    if machine_type == 'moore' or is_dfa:
        if final_states_list is not None and ('outputs' not in data and 'stateOutputs' not in data):
            final_set = set(final_states_list)
            outputs = {State(s.name): ('1' if s.name in final_set else '0') for s in states}
            output_alphabet = data.get('outputAlphabet') or ['0', '1']
        else:
            raw_outputs = data.get('outputs') or data.get('stateOutputs') or {}
            outputs = {State(k): str(v) for k, v in raw_outputs.items()}
            output_alphabet = data.get('outputAlphabet') or list(set(outputs.values())) or ['0', '1']
            
        transitions = [
            Transition(
                from_state=State(t['from']),
                input_symbol=t['input'],
                to_state=State(t['to'])
            ) for t in data.get('transitions', [])
        ]
        return MooreMachine(
            states=states,
            input_alphabet=input_alphabet,
            output_alphabet=output_alphabet,
            initial_state=initial_state,
            outputs=outputs,
            transitions=transitions
        )
    elif machine_type == 'mealy' or any('output' in t for t in data.get('transitions', [])):
        transitions = [
            Transition(
                from_state=State(t['from']),
                input_symbol=t['input'],
                to_state=State(t['to']),
                output_symbol=t.get('output')
            ) for t in data.get('transitions', [])
        ]
        output_alphabet = data.get('outputAlphabet') or list(set(t.output_symbol for t in transitions if t.output_symbol)) or ['0', '1']
        return MealyMachine(
            states=states,
            input_alphabet=input_alphabet,
            output_alphabet=output_alphabet,
            initial_state=initial_state,
            transitions=transitions
        )
    else:
        raise ValueError(f"Unknown machine type: {machine_type or 'unspecified'}")

def serialize_machine(machine: Union[MooreMachine, MealyMachine]) -> Dict[str, Any]:
    """Converts a Python Dataclass back into a JSON dictionary for the frontend."""
    base = {
        "type": machine.type,
        "states": [s.name for s in machine.states],
        "alphabet": machine.input_alphabet,
        "initialState": machine.initial_state.name,
    }
    
    if isinstance(machine, MooreMachine):
        base["outputs"] = {s.name: out for s, out in machine.outputs.items()}
        base["transitions"] = [
            {"from": t.from_state.name, "input": t.input_symbol, "to": t.to_state.name}
            for t in machine.transitions
        ]
    elif isinstance(machine, MealyMachine):
        base["transitions"] = [
            {"from": t.from_state.name, "input": t.input_symbol, "to": t.to_state.name, "output": t.output_symbol}
            for t in machine.transitions
        ]
        
    return base
