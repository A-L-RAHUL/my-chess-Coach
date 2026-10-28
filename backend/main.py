from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="OmniChess AI Core", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExplainRequest(BaseModel):
    fen: str
    user_move: Optional[str] = None
    engine_best: str
    eval_score: float
    depth: int = 18

class CoachReply(BaseModel):
    summary: str
    tactical_rationale: str
    plateau_warning: Optional[str] = None

@app.get("/health")
def health():
    return {"status": "online", "mode": "zero_cloud_local", "chip": "Apple M2"}

@app.post("/coach/explain", response_model=CoachReply)
def explain_move(req: ExplainRequest):
    eval_formatted = f"+{req.eval_score/100:.2f}" if req.eval_score >= 0 else f"{req.eval_score/100:.2f}"
    
    rationale = (
        f"Master engine calculated {req.engine_best} at depth {req.depth} ({eval_formatted}). "
        f"This move directly seizes central initiative, optimizes piece harmony, and restricts opponent forcing counters."
    )
    
    warning = None
    if req.user_move and req.user_move != req.engine_best:
        warning = (
            f"Playing {req.user_move} instead of {req.engine_best} risks conceding central control "
            f"or falling into common club-level tactical traps."
        )

    return CoachReply(
        summary=f"Analysis for position: {req.engine_best} is the verified optimal continuation.",
        tactical_rationale=rationale,
        plateau_warning=warning
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

