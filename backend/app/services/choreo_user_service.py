from typing import Any
from urllib.parse import quote

import httpx

from app.core.config import settings


class ChoreoUserServiceClient:
    """Client for the Choreo User Store API.

    Copy the invoke URL and security header details from the Choreo console into:
    CHOREO_USER_SERVICE_URL, CHOREO_SECURITY_HEADER_NAME, and
    CHOREO_SECURITY_HEADER_VALUE. The header value is never logged or returned.
    """

    def __init__(self) -> None:
        self.base_url = (settings.CHOREO_USER_SERVICE_URL or "").rstrip("/")
        self.header_name = settings.CHOREO_SECURITY_HEADER_NAME
        self.header_value = settings.CHOREO_SECURITY_HEADER_VALUE

    @property
    def configured(self) -> bool:
        return bool(self.base_url and self.header_name and self.header_value)

    def _headers(self) -> dict[str, str]:
        headers = {"Accept": "application/json"}
        if self.header_name and self.header_value:
            headers[self.header_name] = self.header_value
        return headers

    def _url(self, path: str) -> str:
        return f"{self.base_url}{path}"

    def list_users(self) -> list[dict[str, Any]]:
        return self._request("GET", "/users")

    def create_user(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("POST", "/users", json=payload)

    def get_user(self, user_id: str) -> dict[str, Any]:
        return self._request("GET", f"/users/{quote(user_id, safe='')}")

    def update_user(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("PUT", f"/users/{quote(user_id, safe='')}", json=payload)

    def delete_user(self, user_id: str) -> dict[str, Any] | None:
        return self._request("DELETE", f"/users/{quote(user_id, safe='')}")

    def health(self) -> str:
        if not self.configured:
            return "not_configured"
        try:
            self.list_users()
            return "ok"
        except Exception:
            return "error"

    def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        if not self.configured:
            raise RuntimeError("Choreo User Service is not configured.")
        with httpx.Client(timeout=10) as client:
            response = client.request(
                method,
                self._url(path),
                headers=self._headers(),
                **kwargs,
            )
            response.raise_for_status()
            if response.status_code == 204:
                return None
            return response.json()


choreo_user_service = ChoreoUserServiceClient()
