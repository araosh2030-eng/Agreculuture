from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from .. import database, models, schemas

router = APIRouter(prefix="/api/schedule", tags=["Watering Schedule"])

@router.get("", response_model=List[schemas.PlantScheduleResponse])
def get_all_schedules(db: Session = Depends(database.get_db)):
    return db.query(models.PlantSchedule).all()

@router.post("", response_model=schemas.PlantScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_plant_schedule(
    plant_in: schemas.PlantScheduleCreate,
    db: Session = Depends(database.get_db)
):
    new_plant = models.PlantSchedule(
        name=plant_in.name,
        interval_days=plant_in.interval_days
    )
    db.add(new_plant)
    db.commit()
    db.refresh(new_plant)
    return new_plant

@router.put("/{plant_id}/water", response_model=schemas.PlantScheduleResponse)
def mark_plant_watered(plant_id: int, db: Session = Depends(database.get_db)):
    plant = db.query(models.PlantSchedule).filter(models.PlantSchedule.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="النبتة غير موجودة")
    plant.last_watered = datetime.utcnow()
    plant.moisture_level = 100.0
    db.commit()
    db.refresh(plant)
    return plant
