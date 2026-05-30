from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from providers.factory import get_ai_provider

app = FastAPI(title="GovRecover360 - AI Service", version="1.0.0")


class SummarizeDamageRequest(BaseModel):
    notes: str
    damage_level: str
    name: str
    district: str
    family_size: int


class GenerateCitizenMessageRequest(BaseModel):
    name: str
    ref: str
    status: str
    next_step: str


class GenerateDisasterReportRequest(BaseModel):
    stats: dict


class AuditorSummaryRequest(BaseModel):
    logs: list
    count: int


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/api/ai/summarize-damage")
async def summarize_damage(req: SummarizeDamageRequest):
    try:
        provider = get_ai_provider()
        result = await provider.summarize_damage(
            notes=req.notes,
            damage_level=req.damage_level,
            name=req.name,
            district=req.district,
            family_size=req.family_size,
        )
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/generate-citizen-message")
async def generate_citizen_message(req: GenerateCitizenMessageRequest):
    try:
        provider = get_ai_provider()
        result = await provider.generate_citizen_message(
            name=req.name,
            ref=req.ref,
            status=req.status,
            next_step=req.next_step,
        )
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/generate-disaster-report")
async def generate_disaster_report(req: GenerateDisasterReportRequest):
    try:
        provider = get_ai_provider()
        result = await provider.generate_disaster_report(stats=req.stats)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/auditor-summary")
async def auditor_summary(req: AuditorSummaryRequest):
    try:
        provider = get_ai_provider()
        result = await provider.auditor_summary(logs=req.logs, count=req.count)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
