from openai import AsyncOpenAI

from app.config import settings
from providers.base import AIProvider


class OpenAIProvider(AIProvider):

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model

    async def _call(self, prompt: str) -> str:
        resp = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500,
        )
        return resp.choices[0].message.content.strip()

    async def summarize_damage(self, notes: str, damage_level: str, name: str, district: str, family_size: int) -> str:
        prompt = (
            f"Summarize this damage assessment for official records: {notes}. "
            f"Damage level: {damage_level}. "
            f"Household head: {name}, District: {district}, Family size: {family_size}. "
            f"Keep it professional and concise."
        )
        return await self._call(prompt)

    async def generate_citizen_message(self, name: str, ref: str, status: str, next_step: str) -> str:
        prompt = (
            f"Generate a short SMS message for citizen {name} about relief application "
            f"(Ref: {ref}) status {status}. Next step: {next_step}. "
            f"Keep it friendly and clear."
        )
        return await self._call(prompt)

    async def generate_disaster_report(self, stats: dict) -> str:
        prompt = (
            f"Generate an official disaster report summary with these stats: {stats}. "
            f"Format as a government briefing."
        )
        return await self._call(prompt)

    async def auditor_summary(self, logs: list, count: int) -> str:
        prompt = (
            f"Review these audit logs and identify any suspicious patterns: {logs}. "
            f"Total actions reviewed: {count}."
        )
        return await self._call(prompt)
