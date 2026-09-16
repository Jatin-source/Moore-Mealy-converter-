from dataclasses import dataclass
from typing import Optional
from .state import State

@dataclass(frozen=True)
class Transition:
    from_state: State
    input_symbol: str
    to_state: State
    output_symbol: Optional[str] = None  # None for Moore machine transitions
