from typing import Optional
from datetime import date
from sqlalchemy import String, Float, Integer, Date, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class TrainingProgress(Base):
    __tablename__ = "training_progress"

    progress_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    operator_id: Mapped[str] = mapped_column(String(16), ForeignKey("operators.operator_id"), nullable=False)
    training_id: Mapped[str] = mapped_column(String(16), ForeignKey("training_modules.training_id"), nullable=False)
    assigned_date: Mapped[date] = mapped_column(Date, nullable=False)
    completion_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reason_recommended: Mapped[str] = mapped_column(String(250), nullable=False)

    __table_args__ = (
        Index("idx_tp_operator_training", "operator_id", "training_id"),
    )
