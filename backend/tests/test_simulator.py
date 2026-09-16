import pytest
from backend.models.state import State
from backend.models.transition import Transition
from backend.models.moore_machine import MooreMachine
from backend.simulation.simulator import simulate_machine

def test_moore_simulation_initial_output():
    moore = MooreMachine(
        states=[State('q0'), State('q1')],
        input_alphabet=['0'],
        output_alphabet=['a', 'b'],
        initial_state=State('q0'),
        outputs={State('q0'): 'a', State('q1'): 'b'},
        transitions=[
            Transition(State('q0'), '0', State('q1')),
            Transition(State('q1'), '0', State('q0'))
        ]
    )
    
    # Simulating empty string should yield just the initial output
    result_empty = simulate_machine(moore, "")
    assert result_empty["output_string"] == "a"
    assert len(result_empty["path"]) == 1
    
    # Simulating "00" -> path: q0 -> q1 -> q0
    # Output: a (initial), b (q1), a (q0) -> "aba"
    result_00 = simulate_machine(moore, "00")
    assert result_00["output_string"] == "aba"
    assert result_00["final_state"] == "q0"
    assert len(result_00["path"]) == 3
