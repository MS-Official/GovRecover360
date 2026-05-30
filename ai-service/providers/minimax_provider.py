import json

import httpx

from app.config import settings
from providers.base import AIProvider


class MinimaxProvider(AIProvider):

    def __init__(self):
        self.api_key = settings.minimax_api_key
        self.model = settings.minimax_model
        self.base_url = "https://api.minimax.chat/v1/text/chatcompletion"

    async def _call(self, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 500,
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(self.base_url, headers=headers, json=payload, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

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
