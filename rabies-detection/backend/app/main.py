"""
Rabies Risk Detection — FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import predict

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Rabies Risk Detection API",
    description="Research-grade clinical decision support powered by XGBoost ML",
    version="1.0.0",
)

# CORS — allow all for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
