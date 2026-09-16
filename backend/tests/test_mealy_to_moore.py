import pytest
from backend.models.state import State
from backend.models.transition import Transition
from backend.models.mealy_machine import MealyMachine
from backend.algorithms.mealy_to_moore import convert_mealy_to_moore

def test_state_splitting_mealy_to_moore():
    mealy = MealyMachine(
        states=[State('q0'), State('q1')],
        input_alphabet=['a', 'b'],
        output_alphabet=['0', '1'],
        initial_state=State('q0'),
        transitions=[
            Transition(State('q0'), 'a', State('q1'), '0'),
            Transition(State('q0'), 'b', State('q1'), '1'), # q1 reached with both 0 and 1!
            Transition(State('q1'), 'a', State('q0'), '1'),
            Transition(State('q1'), 'b', State('q1'), '0')
        ]
    )
    
    moore, steps = convert_mealy_to_moore(mealy)
    
    state_names = [s.name for s in moore.states]
    
    # q1 should split into q1_0 and q1_1
    assert 'q1_0' in state_names, "State splitting failed for output 0"
    assert 'q1_1' in state_names, "State splitting failed for output 1"
    
    # q0 has incoming transition with output '1', so it becomes q0_1
    # Plus initial state handling might create a default if it had no incoming, 
    # but here q1 -> q0 outputs '1', so q0_1 exists.
    assert 'q0_1' in state_names
    
    # Check outputs dictionary mapping
    assert moore.outputs[State('q1_0')] == '0'
    assert moore.outputs[State('q1_1')] == '1'
    
    # Check that q1's outgoing transitions were duplicated for BOTH split variants
    q1_0_outgoing = [t for t in moore.transitions if t.from_state.name == 'q1_0']
    q1_1_outgoing = [t for t in moore.transitions if t.from_state.name == 'q1_1']
    
    assert len(q1_0_outgoing) == 2
    assert len(q1_1_outgoing) == 2
    
    # Check the self-loop mapping
    # Original: q1 --b/0--> q1. So new transitions must target q1_0.
    loop_0 = next(t for t in q1_0_outgoing if t.input_symbol == 'b')
    loop_1 = next(t for t in q1_1_outgoing if t.input_symbol == 'b')
    assert loop_0.to_state.name == 'q1_0'
    assert loop_1.to_state.name == 'q1_0'
