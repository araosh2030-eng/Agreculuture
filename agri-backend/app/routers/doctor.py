from fastapi import APIRouter, UploadFile, File, HTTPException
from .. import schemas

router = APIRouter(prefix="/api/doctor", tags=["Plant Doctor AI"])

@router.post("/analyze", response_model=schemas.DoctorDiagnosisResponse)
async def analyze_plant_health(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="يرجى رفع ملف صورة صالح")
    
    # يمكن دمج نموذج PyTorch / TensorFlow هنا لتشخيص الصورة الفعلية
    return schemas.DoctorDiagnosisResponse(
        filename=file.filename,
        confidence=0.96,
        disease_name="البقع الفطرية السوداء (Black Spot)",
        symptoms="بقع دائرية بنية داكنة مع اصفرار حول أطراف الورقة بسبب الرطوبة العالية وتجمع المياه.",
        treatment=[
            "قص الأوراق المصابة بشدة والتخلص منها فوراً.",
            "رش النبات بمبيد فطري نحاسي مرتين أسبوعياً.",
            "تجنب ري الأوراق مباشرة والري في الصباح الباكر فقط."
        ]
    )
