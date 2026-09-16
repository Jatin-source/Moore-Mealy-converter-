from dataclasses import dataclass
from typing import List, Dict
from .state import State
from .transition import Transition

@dataclass
class MooreMachine:
    states: List[State]
    input_alphabet: List[str]
    output_alphabet: List[str]
    initial_state: State
    outputs: Dict[State, str]
    transitions: List[Transition]

    def __post_init__(self):
        self.type = "moore"
