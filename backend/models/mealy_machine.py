from dataclasses import dataclass
from typing import List
from .state import State
from .transition import Transition

@dataclass
class MealyMachine:
    states: List[State]
    input_alphabet: List[str]
    output_alphabet: List[str]
    initial_state: State
    transitions: List[Transition]

    def __post_init__(self):
        self.type = "mealy"
