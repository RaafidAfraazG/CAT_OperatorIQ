from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class Operator(Base):
    __tablename__ = "operators"

    operator_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    operator_name: Mapped[str] = mapped_column(String(100))
    experience_years: Mapped[float] = mapped_column(Float)
    skill_level: Mapped[str] = mapped_column(String(50))
    certification_level: Mapped[str] = mapped_column(String(50))
    training_score: Mapped[float] = mapped_column(Float)
    safety_score: Mapped[float] = mapped_column(Float)
    average_productivity_score: Mapped[float] = mapped_column(Float)
