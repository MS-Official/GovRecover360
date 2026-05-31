from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://govrecover:govrecover@localhost:5432/govrecover"
    SECRET_KEY: str = "super-secret-key-change-in-production-12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REDIS_URL: str | None = None
    AI_SERVICE_URL: str | None = None
    CHOREO_NOTIFIER_API_URL: str | None = None
    CHOREO_USER_SERVICE_URL: str | None = None
    CHOREO_SECURITY_HEADER_NAME: str | None = None
    CHOREO_SECURITY_HEADER_VALUE: str | None = None
    FRONTEND_URL: str | None = None
    ODOO_BASE_URL: str | None = None
    ODOO_URL: str | None = None
    ODOO_DB: str | None = None
    ODOO_USERNAME: str | None = None
    ODOO_PASSWORD: str | None = None
    AUTH_MODE: str = "mock"
    ASGARDEO_ISSUER: str | None = None
    ASGARDEO_JWKS_URL: str | None = None
    ASGARDEO_AUDIENCE: str | None = None
    ASGARDEO_CLIENT_ID: str | None = None
    ASGARDEO_ORG_NAME: str | None = None
    ASGARDEO_SIGN_UP_URL: str | None = None
    WSO2_GATEWAY_URL: str | None = None
    WSO2_PUBLISHER_URL: str | None = None
    SUPERSET_URL: str | None = None
    GEONODE_URL: str | None = None
    OPENG2P_ENABLED: bool = False
    OPENG2P_BASE_URL: str | None = None
    OPENG2P_API_BASE_URL: str | None = None
    OPENG2P_DB: str | None = None
    OPENG2P_USERNAME: str | None = None
    OPENG2P_PASSWORD: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
