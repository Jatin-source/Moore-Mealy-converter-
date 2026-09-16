import pytest
from backend.models.state import State
from backend.models.transition import Transition
from backend.models.moore_machine import MooreMachine
from backend.algorithms.moore_to_mealy import convert_moore_to_mealy

def test_basic_moore_to_mealy_conversion():
    moore = MooreMachine(
        states=[State('q0'), State('q1')],
        input_alphabet=['a', 'b'],
        output_alphabet=['0', '1'],
        initial_state=State('q0'),
        outputs={State('q0'): '0', State('q1'): '1'},
        transitions=[
            Transition(State('q0'), 'a', State('q1')),
            Transition(State('q0'), 'b', State('q0')),
            Transition(State('q1'), 'a', State('q0')),
            Transition(State('q1'), 'b', State('q1'))
        ]
    )
    
    mealy, steps = convert_moore_to_mealy(moore)
    
    assert len(mealy.states) == 2, "State count must be preserved"
    assert mealy.initial_state.name == 'q0'
    
    # Check that transition to q1 now carries output '1'
    q0_a_q1 = next(t for t in mealy.transitions if t.from_state.name == 'q0' and t.input_symbol == 'a')
    assert q0_a_q1.to_state.name == 'q1'
    assert q0_a_q1.output_symbol == '1'
    
    # Check that transition to q0 now carries output '0'
    q1_a_q0 = next(t for t in mealy.transitions if t.from_state.name == 'q1' and t.input_symbol == 'a')
    assert q1_a_q0.to_state.name == 'q0'
    assert q1_a_q0.output_symbol == '0'
