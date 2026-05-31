from urllib.request import urlopen
import json

from jose import JWTError, jwt

from app.core.config import settings


SCOPE_PERMISSION_MAP = {
    "citizen:read": "citizen:read",
    "citizen:create": "citizen:create",
    "citizen:write": "citizen:create",
    "beneficiary:read": "beneficiary:read",
    "beneficiary:verify": "beneficiary:verify",
    "relief:read": "relief:read",
    "relief:approve": "relief:approve",
    "payment:read": "payment:read",
    "payment:approve": "payment:approve",
    "inventory:read": "inventory:read",
    "inventory:dispatch": "inventory:dispatch",
    "geo:read": "geo:read",
    "geo:manage": "geo:manage",
    "audit:read": "audit:read",
    "admin:manage": "admin:manage",
}


class WSO2Service:
    def __init__(self) -> None:
        self.enabled = bool(settings.WSO2_APIM_ENABLED)
        self.gateway_url = (settings.WSO2_GATEWAY_URL or "").rstrip("/")
        self.publisher_url = (settings.WSO2_PUBLISHER_URL or "").rstrip("/")
        self._jwks_cache: dict | None = None

    @property
    def configured(self) -> bool:
        return bool(self.enabled and self.gateway_url)

    @property
    def jwt_validation_configured(self) -> bool:
        return bool(
            self.enabled
            and settings.WSO2_JWKS_URL
            and settings.WSO2_ISSUER
            and settings.WSO2_AUDIENCE
        )

    def health(self) -> dict:
        if not self.enabled:
            return self._response("disabled", reachable=False)
        if not self.gateway_url:
            return self._response(
                "not_configured",
                reachable=False,
                message="WSO2_APIM_ENABLED is true but WSO2_GATEWAY_URL is missing.",
            )
        try:
            with urlopen(f"{self.gateway_url}/services/Version", timeout=5) as response:
                if 200 <= response.status < 300:
                    return self._response("live", reachable=True)
        except Exception:
            pass
        return self._response(
            "unreachable",
            reachable=False,
            message="WSO2 API Manager gateway is not reachable; backend local JWT RBAC remains active.",
        )

    def validate_access_token(self, token: str) -> dict:
        if not self.jwt_validation_configured:
            raise JWTError("WSO2 JWT validation is not configured.")
        return jwt.decode(
            token,
            self._select_jwk(token),
            algorithms=["RS256"],
            issuer=settings.WSO2_ISSUER,
            audience=settings.WSO2_AUDIENCE,
            options={"verify_at_hash": False},
        )

    def permissions_from_claims(self, payload: dict) -> list[str]:
        scopes: list[str] = []
        raw_scope = payload.get("scope") or payload.get("scp") or payload.get("scopes")
        if isinstance(raw_scope, str):
            scopes.extend(raw_scope.split())
        elif isinstance(raw_scope, list):
            scopes.extend(str(scope) for scope in raw_scope)

        permissions = {
            SCOPE_PERMISSION_MAP[scope]
            for scope in scopes
            if scope in SCOPE_PERMISSION_MAP
        }
        if "admin:manage" in permissions:
            permissions.update(SCOPE_PERMISSION_MAP.values())
        return sorted(permissions)

    def _select_jwk(self, token: str) -> dict:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        for key in self._get_jwks().get("keys", []):
            if key.get("kid") == kid:
                return key
        raise JWTError("WSO2 signing key not found.")

    def _get_jwks(self) -> dict:
        if self._jwks_cache is None:
            with urlopen(settings.WSO2_JWKS_URL, timeout=5) as response:
                self._jwks_cache = json.loads(response.read().decode("utf-8"))
        return self._jwks_cache

    def _response(self, mode: str, **extra) -> dict:
        return {
            "mode": mode,
            "wso2_apim_enabled": self.enabled,
            "wso2_apim_configured": self.configured,
            "jwt_validation_configured": self.jwt_validation_configured,
            "gateway_configured": bool(self.gateway_url),
            "publisher_configured": bool(self.publisher_url),
            **extra,
        }


wso2_service = WSO2Service()
