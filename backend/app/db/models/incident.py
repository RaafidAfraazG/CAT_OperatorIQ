from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    incident_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    machine_id: Mapped[str] = mapped_column(String(16), ForeignKey("machines.machine_id"), nullable=False)
    operator_id: Mapped[str] = mapped_column(String(16), ForeignKey("operators.operator_id"), nullable=False)
    task_id: Mapped[str] = mapped_column(String(16), ForeignKey("tasks.task_id"), nullable=False)
    site_id: Mapped[str] = mapped_column(String(16), ForeignKey("sites.site_id"), nullable=False)
    incident_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location_zone: Mapped[str] = mapped_column(String(50), nullable=False)
    injury_occurred: Mapped[bool] = mapped_column(Boolean, nullable=False)
    machine_damage: Mapped[str] = mapped_column(String(100), nullable=False)
    resolved: Mapped[bool] = mapped_column(Boolean, nullable=False)
    operator_reported: Mapped[bool] = mapped_column(Boolean, nullable=False)
