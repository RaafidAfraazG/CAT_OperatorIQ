from typing import Optional
from datetime import datetime
from sqlalchemy import String, Float, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class Telemetry(Base):
    __tablename__ = "telemetry"

    telemetry_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    machine_id: Mapped[str] = mapped_column(String(16), ForeignKey("machines.machine_id"), nullable=False)
    operator_id: Mapped[str] = mapped_column(String(16), ForeignKey("operators.operator_id"), nullable=False)
    task_id: Mapped[str] = mapped_column(String(16), ForeignKey("tasks.task_id"), nullable=False)
    site_id: Mapped[str] = mapped_column(String(16), ForeignKey("sites.site_id"), nullable=False)
    engine_on: Mapped[bool] = mapped_column(Boolean, nullable=False)
    engine_rpm: Mapped[int] = mapped_column(Integer, nullable=False)
    engine_load_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    engine_hours: Mapped[float] = mapped_column(Float, nullable=False)
    machine_speed_kmh: Mapped[float] = mapped_column(Float, nullable=False)
    fuel_level_percent: Mapped[float] = mapped_column(Float, nullable=False)
    fuel_rate_lph: Mapped[float] = mapped_column(Float, nullable=False)
    fuel_used_l: Mapped[float] = mapped_column(Float, nullable=False)
    hydraulic_pressure_bar: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    coolant_temperature_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    operating_state: Mapped[str] = mapped_column(String(50), nullable=False)
    idle_duration_min: Mapped[float] = mapped_column(Float, nullable=False)
    load_cycles: Mapped[int] = mapped_column(Integer, nullable=False)
    bucket_or_attachment_load_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    seatbelt_status: Mapped[str] = mapped_column(String(20), nullable=False)
    nearest_person_distance_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    nearest_vehicle_distance_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    nearest_obstacle_distance_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    __table_args__ = (
        Index("idx_telemetry_machine_time", "machine_id", "timestamp"),
        Index("idx_telemetry_operator_time", "operator_id", "timestamp"),
        Index("idx_telemetry_task_time", "task_id", "timestamp"),
    )
