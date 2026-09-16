from typing import Union, Dict, Any
from backend.models.state import State
from backend.models.transition import Transition
from backend.models.moore_machine import MooreMachine
from backend.models.mealy_machine import MealyMachine

def deserialize_machine(data: Dict[str, Any]) -> Union[MooreMachine, MealyMachine]:
    """Converts a JSON dictionary from the frontend into a Python Dataclass."""
    machine_type = data.get('type')
    states = [State(s) for s in data.get('states', [])]
    input_alphabet = data.get('alphabet', [])
    # Infer output alphabet from outputs or transitions if not explicitly provided
    initial_state = State(data.get('initialState', ''))
    
    if machine_type == 'moore':
        outputs = {State(k): v for k, v in data.get('outputs', {}).items()}
        output_alphabet = list(set(outputs.values()))
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
    elif machine_type == 'mealy':
        transitions = [
            Transition(
                from_state=State(t['from']),
                input_symbol=t['input'],
                to_state=State(t['to']),
                output_symbol=t['output']
            ) for t in data.get('transitions', [])
        ]
        output_alphabet = list(set(t.output_symbol for t in transitions if t.output_symbol))
        return MealyMachine(
            states=states,
            input_alphabet=input_alphabet,
            output_alphabet=output_alphabet,
            initial_state=initial_state,
            transitions=transitions
        )
    else:
        raise ValueError(f"Unknown machine type: {machine_type}")

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
