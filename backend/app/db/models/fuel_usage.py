from typing import Optional
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class FuelUsage(Base):
    __tablename__ = "fuel_usage"

    fuel_record_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    machine_id: Mapped[str] = mapped_column(String(16), ForeignKey("machines.machine_id"), nullable=False)
    operator_id: Mapped[str] = mapped_column(String(16), ForeignKey("operators.operator_id"), nullable=False)
    task_id: Mapped[str] = mapped_column(String(16), ForeignKey("tasks.task_id"), nullable=False)
    fuel_start_l: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fuel_end_l: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fuel_used_l: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fuel_rate_lph: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    operating_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    idle_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    idle_fuel_l: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    working_fuel_l: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fuel_efficiency_l_per_hour: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    expected_fuel_rate_lph: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fuel_deviation_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    __table_args__ = (
        Index("idx_fuel_machine_time", "machine_id", "timestamp"),
        Index("idx_fuel_operator_time", "operator_id", "timestamp"),
        Index("idx_fuel_task_time", "task_id", "timestamp"),
    )
