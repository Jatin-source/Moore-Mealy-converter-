import pytest
from backend.models.state import State
from backend.models.transition import Transition
from backend.models.moore_machine import MooreMachine
from backend.validation.validator import validate_machine

def test_validation_empty_machine():
    empty_machine = MooreMachine(
        states=[],
        input_alphabet=[],
        output_alphabet=[],
        initial_state=State('q0'),
        outputs={},
        transitions=[]
    )
    errors = validate_machine(empty_machine)
    assert len(errors) > 0
    assert "Machine has no states." in errors[0]

def test_validation_missing_transitions():
    bad_machine = MooreMachine(
        states=[State('q0')],
        input_alphabet=['0', '1'],
        output_alphabet=['a'],
        initial_state=State('q0'),
        outputs={State('q0'): 'a'},
        transitions=[
            Transition(State('q0'), '0', State('q0'))
            # Missing transition for input '1'
        ]
    )
    errors = validate_machine(bad_machine)
    assert any("Missing transition" in e for e in errors)

def test_validation_invalid_reference():
    bad_machine = MooreMachine(
        states=[State('q0')],
        input_alphabet=['0'],
        output_alphabet=['a'],
        initial_state=State('q0'),
        outputs={State('q0'): 'a'},
        transitions=[
            Transition(State('q0'), '0', State('q_ghost')) # q_ghost doesn't exist
        ]
    )
    errors = validate_machine(bad_machine)
    assert any("unknown destination state" in e for e in errors)
