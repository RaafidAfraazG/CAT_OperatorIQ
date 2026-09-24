from typing import Optional
from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class TaskHistory(Base):
    __tablename__ = "task_history"

    task_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    source_task_id: Mapped[Optional[str]] = mapped_column(String(16), ForeignKey("tasks.task_id"), nullable=True)
    machine_type: Mapped[str] = mapped_column(String(50))
    machine_model: Mapped[str] = mapped_column(String(50))
    task_type: Mapped[str] = mapped_column(String(50))
    operator_skill_level: Mapped[str] = mapped_column(String(50))
    operator_experience_years: Mapped[float] = mapped_column(Float)
    material_type: Mapped[str] = mapped_column(String(50))
    material_density: Mapped[float] = mapped_column(Float)
    target_quantity: Mapped[float] = mapped_column(Float)
    terrain_type: Mapped[str] = mapped_column(String(50))
    terrain_slope_percent: Mapped[float] = mapped_column(Float)
    soil_moisture: Mapped[float] = mapped_column(Float)
    weather_condition: Mapped[str] = mapped_column(String(50))
    temperature_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rainfall_mm: Mapped[float] = mapped_column(Float)
    visibility_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    distance_m: Mapped[float] = mapped_column(Float)
    machine_age_years: Mapped[float] = mapped_column(Float)
    idle_ratio: Mapped[float] = mapped_column(Float)
    average_engine_load: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    average_rpm: Mapped[float] = mapped_column(Float)
    estimated_duration_min: Mapped[float] = mapped_column(Float)
    actual_duration_min: Mapped[float] = mapped_column(Float)
