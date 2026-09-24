from typing import Optional
from datetime import datetime
from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class Task(Base):
    __tablename__ = "tasks"

    task_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    machine_id: Mapped[str] = mapped_column(String(16), ForeignKey("machines.machine_id"))
    operator_id: Mapped[str] = mapped_column(String(16), ForeignKey("operators.operator_id"))
    site_id: Mapped[str] = mapped_column(String(16), ForeignKey("sites.site_id"))
    task_type: Mapped[str] = mapped_column(String(50))
    task_status: Mapped[str] = mapped_column(String(50))
    scheduled_start: Mapped[datetime] = mapped_column(DateTime)
    scheduled_end: Mapped[datetime] = mapped_column(DateTime)
    target_quantity: Mapped[float] = mapped_column(Float)
    quantity_unit: Mapped[str] = mapped_column(String(20))
    estimated_duration_min: Mapped[float] = mapped_column(Float)
    actual_duration_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    task_efficiency: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
