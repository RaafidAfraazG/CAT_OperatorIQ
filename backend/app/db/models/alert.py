from typing import Optional
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    alert_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    machine_id: Mapped[str] = mapped_column(String(16), ForeignKey("machines.machine_id"), nullable=False)
    operator_id: Mapped[Optional[str]] = mapped_column(String(16), ForeignKey("operators.operator_id"), nullable=True)
    task_id: Mapped[Optional[str]] = mapped_column(String(16), ForeignKey("tasks.task_id"), nullable=True)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    recommended_action: Mapped[str] = mapped_column(Text, nullable=False)
    resolved: Mapped[bool] = mapped_column(Boolean, nullable=False)

    __table_args__ = (
        Index("idx_alerts_resolved_severity", "resolved", "severity"),
        Index("idx_alerts_machine_time", "machine_id", "timestamp"),
        Index("idx_alerts_operator_time", "operator_id", "timestamp"),
    )
