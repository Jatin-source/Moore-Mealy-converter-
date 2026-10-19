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

def test_verify_equivalence_moore_and_mealy():
    from backend.algorithms.moore_to_mealy import convert_moore_to_mealy
    from backend.simulation.simulator import verify_equivalence
    
    moore = MooreMachine(
        states=[State('q0'), State('q1')],
        input_alphabet=['0', '1'],
        output_alphabet=['0', '1'],
        initial_state=State('q0'),
        outputs={State('q0'): '0', State('q1'): '1'},
        transitions=[
            Transition(State('q0'), '0', State('q1')),
            Transition(State('q0'), '1', State('q0')),
            Transition(State('q1'), '0', State('q1')),
            Transition(State('q1'), '1', State('q0'))
        ]
    )
    
    mealy, _ = convert_moore_to_mealy(moore)
    
    report = verify_equivalence(moore, mealy, ["0", "1", "0101", "11001", ""])
    assert report["all_matched"] is True
    assert report["total"] == 5
    assert report["passed"] == 5

