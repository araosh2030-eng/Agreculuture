from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import database, models
from .routers import auth, doctor, schedule, community

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Digital Agriculture API",
    description="Backend API for Digital Agriculture Platform built with FastAPI & SQLAlchemy",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(doctor.router)
app.include_router(schedule.router)
app.include_router(community.router)

@app.get("/", tags=["Health Check"])
def root_check():
    return {
        "status": "online",
        "message": "مرحباً بك في خادم منصة الزراعة الرقمية الذكية (Digital Agriculture API)",
        "docs_url": "/docs"
    }
