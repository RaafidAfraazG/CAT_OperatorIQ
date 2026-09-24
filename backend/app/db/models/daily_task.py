from typing import Optional
from datetime import date, datetime
from sqlalchemy import String, Float, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class DailyTask(Base):
    __tablename__ = "daily_tasks"

    daily_task_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    operator_id: Mapped[str] = mapped_column(String(16), ForeignKey("operators.operator_id"), nullable=False)
    machine_id: Mapped[str] = mapped_column(String(16), ForeignKey("machines.machine_id"), nullable=False)
    task_id: Mapped[Optional[str]] = mapped_column(String(16), ForeignKey("tasks.task_id"), nullable=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False)
    scheduled_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    scheduled_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    task_type: Mapped[str] = mapped_column(String(50), nullable=False)
    location_zone: Mapped[str] = mapped_column(String(50), nullable=False)
    target_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
