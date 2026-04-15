from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from app.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, nullable=False)
    input_data = Column(Text, nullable=False)   # JSON string
    result = Column(Text, nullable=False)        # JSON string
    risk_level = Column(String, nullable=False)
    probability = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
