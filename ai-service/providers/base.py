from abc import ABC, abstractmethod


class AIProvider(ABC):

    @abstractmethod
    async def summarize_damage(self, notes: str, damage_level: str, name: str, district: str, family_size: int) -> str:
        pass

    @abstractmethod
    async def generate_citizen_message(self, name: str, ref: str, status: str, next_step: str) -> str:
        pass

    @abstractmethod
    async def generate_disaster_report(self, stats: dict) -> str:
        pass

    @abstractmethod
    async def auditor_summary(self, logs: list, count: int) -> str:
        pass
