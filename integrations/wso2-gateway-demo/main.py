import os

import httpx
from fastapi import FastAPI, Request, Response

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000").rstrip("/")

app = FastAPI(title="GovRecover360 WSO2 API Manager Demo Gateway", version="1.0.0")


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "wso2-api-manager-demo-gateway",
        "mode": "demo-gateway",
        "backend_url": BACKEND_URL,
    }


@app.get("/services/Version")
def version():
    return {
        "product": "WSO2 API Manager Demo Gateway",
        "version": "demo-1.0.0",
        "gateway": "healthy",
    }


@app.post("/oauth2/token")
def token():
    return {
        "access_token": "demo-wso2-token-use-backend-login-token-for-protected-apis",
        "token_type": "Bearer",
        "expires_in": 3600,
        "scope": "citizen:read citizen:create beneficiary:verify relief:approve payment:approve inventory:dispatch geo:manage audit:read",
    }


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_api(path: str, request: Request):
    target = f"{BACKEND_URL}/api/{path}"
    body = await request.body()
    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"host", "content-length"}
    }
    async with httpx.AsyncClient(timeout=30) as client:
        upstream = await client.request(
            request.method,
            target,
            params=request.query_params,
            content=body,
            headers=headers,
        )
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers={
            key: value
            for key, value in upstream.headers.items()
            if key.lower() not in {"content-encoding", "transfer-encoding", "connection"}
        },
        media_type=upstream.headers.get("content-type"),
    )
