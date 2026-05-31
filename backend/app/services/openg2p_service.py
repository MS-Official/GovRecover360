from typing import Any
from urllib.parse import quote
from uuid import uuid4

import httpx

from app.core.config import settings


class OpenG2PService:
    """Demo-safe OpenG2P client.

    The real OpenG2P runtime can run in a separate stack such as
    govaid-connect-openg2p-demo. Configure OPENG2P_API_BASE_URL and credentials
    in backend env. Passwords are never returned by this service.
    """

    def __init__(self) -> None:
        self.enabled = bool(settings.OPENG2P_ENABLED)
        self.base_url = (settings.OPENG2P_BASE_URL or "").rstrip("/")
        self.api_base_url = (settings.OPENG2P_API_BASE_URL or self.base_url).rstrip("/")

    @property
    def configured(self) -> bool:
        return bool(
            self.enabled
            and self.api_base_url
            and settings.OPENG2P_DB
            and settings.OPENG2P_USERNAME
            and settings.OPENG2P_PASSWORD
        )

    def health(self) -> dict:
        if not self.enabled:
            return self._mock_response("disabled", {"reachable": False})
        if not self.configured:
            return {
                "mode": "not_configured",
                "reachable": False,
                "message": "OpenG2P is enabled but required environment values are missing.",
            }
        try:
            with httpx.Client(timeout=5) as client:
                response = client.get(f"{self.api_base_url}/health")
            if 200 <= response.status_code < 300:
                return {"mode": "live", "reachable": True, "status": "ok"}
        except Exception:
            pass
        return self._mock_response(
            "unreachable",
            {
                "reachable": False,
                "message": "OpenG2P is not reachable. Returning demo fallback responses.",
            },
        )

    def create_beneficiary(self, payload: dict) -> dict:
        return self._post_or_mock(
            "/beneficiaries",
            payload,
            lambda: {
                "beneficiary_id": f"openg2p-demo-{uuid4().hex[:10]}",
                "status": "registered",
                "source": "mock",
                "payload": payload,
            },
        )

    def sync_beneficiary(self, payload: dict) -> dict:
        fallback = lambda: {
            "beneficiary_id": payload.get("beneficiaryId") or payload.get("beneficiary_id") or f"openg2p-demo-{uuid4().hex[:10]}",
            "status": "synced",
            "source": "mock",
            "payload": payload,
        }
        if not self._live_ready():
            return self._mock_response("mock", fallback())
        try:
            return self._request("POST", "/beneficiaries/sync", json=payload)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                return self._request("POST", "/beneficiaries", json=payload)
            raise

    def get_beneficiary(self, beneficiary_id: str) -> dict:
        if not self._live_ready():
            return self._mock_response(
                "mock",
                {
                    "beneficiary_id": beneficiary_id,
                    "status": "registered",
                    "source": "mock",
                },
            )
        return self._request("GET", f"/beneficiaries/{quote(beneficiary_id, safe='')}")

    def check_eligibility(self, payload: dict) -> dict:
        family_size = int(payload.get("family_size") or 0)
        damage_level = str(payload.get("damage_level") or "").upper()
        eligible = damage_level in {"SEVERE", "TOTAL"} or family_size >= 4
        status = "eligible" if eligible else "pending_verification"
        return self._post_or_mock(
            "/eligibility/check",
            payload,
            lambda: {
                "eligibility_status": status,
                "eligible": eligible,
                "reason": "Demo rule: severe/total damage or family size of at least 4.",
                "source": "mock",
            },
        )

    def create_entitlement(self, payload: dict) -> dict:
        return self._post_or_mock(
            "/entitlements",
            payload,
            lambda: {
                "entitlement_id": f"ent-demo-{uuid4().hex[:10]}",
                "entitlement_status": "created",
                "disbursement_status": "pending",
                "source": "mock",
                "payload": payload,
            },
        )

    def list_entitlements(self) -> dict:
        if not self._live_ready():
            return self._mock_response(
                "mock",
                {
                    "entitlements": [],
                    "message": "No live OpenG2P entitlement list is available in mock mode.",
                },
            )
        return self._request("GET", "/entitlements")

    def enroll_in_program(self, payload: dict) -> dict:
        return self._post_or_mock(
            "/program-enrollments",
            payload,
            lambda: {
                "enrollment_id": f"enroll-demo-{uuid4().hex[:10]}",
                "enrollment_status": "enrolled",
                "source": "mock",
                "payload": payload,
            },
        )

    def _live_ready(self) -> bool:
        if not self.configured:
            return False
        return self.health().get("mode") == "live"

    def _post_or_mock(self, path: str, payload: dict, fallback) -> dict:
        if not self._live_ready():
            return self._mock_response("mock", fallback())
        return self._request("POST", path, json=payload)

    def _request(self, method: str, path: str, **kwargs: Any) -> dict:
        with httpx.Client(timeout=10) as client:
            response = client.request(method, f"{self.api_base_url}{path}", **kwargs)
        response.raise_for_status()
        return response.json()

    def _mock_response(self, mode: str, data: dict) -> dict:
        return {
            "mode": mode,
            "openg2p_enabled": self.enabled,
            "openg2p_configured": self.configured,
            **data,
        }


openg2p_service = OpenG2PService()
