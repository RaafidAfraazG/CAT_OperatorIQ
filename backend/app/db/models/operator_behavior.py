from typing import Optional
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class OperatorBehavior(Base):
    __tablename__ = "operator_behavior"

    behavior_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    operator_id: Mapped[str] = mapped_column(String(16), ForeignKey("operators.operator_id"), nullable=False)
    machine_id: Mapped[str] = mapped_column(String(16), ForeignKey("machines.machine_id"), nullable=False)
    task_id: Mapped[Optional[str]] = mapped_column(String(16), ForeignKey("tasks.task_id"), nullable=True)
    idle_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    average_rpm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_rpm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    average_speed: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hard_braking_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rapid_acceleration_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reverse_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    seatbelt_violation_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    proximity_event_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fuel_efficiency: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    task_efficiency: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    behavior_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    __table_args__ = (
        Index("idx_behavior_operator_time", "operator_id", "timestamp"),
        Index("idx_behavior_machine_time", "machine_id", "timestamp"),
    )
