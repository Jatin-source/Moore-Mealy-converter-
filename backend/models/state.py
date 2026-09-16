from dataclasses import dataclass

@dataclass(frozen=True)
class State:
    name: str

    def __str__(self):
        return self.name
