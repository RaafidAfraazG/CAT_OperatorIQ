from typing import Optional
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class SafetyEvent(Base):
    __tablename__ = "safety_events"

    event_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    machine_id: Mapped[str] = mapped_column(String(16), ForeignKey("machines.machine_id"), nullable=False)
    operator_id: Mapped[str] = mapped_column(String(16), ForeignKey("operators.operator_id"), nullable=False)
    task_id: Mapped[str] = mapped_column(String(16), ForeignKey("tasks.task_id"), nullable=False)
    site_id: Mapped[str] = mapped_column(String(16), ForeignKey("sites.site_id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    machine_speed_kmh: Mapped[float] = mapped_column(Float, nullable=False)
    machine_state: Mapped[str] = mapped_column(String(50), nullable=False)
    distance_to_person_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    distance_to_vehicle_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    distance_to_obstacle_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    seatbelt_status: Mapped[str] = mapped_column(String(20), nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    resolved: Mapped[bool] = mapped_column(Boolean, nullable=False)

    __table_args__ = (
        Index("idx_safety_operator_time", "operator_id", "timestamp"),
        Index("idx_safety_machine_time", "machine_id", "timestamp"),
    )
