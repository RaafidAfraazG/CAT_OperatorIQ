from typing import Optional
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class Environment(Base):
    __tablename__ = "environment"

    env_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    site_id: Mapped[str] = mapped_column(String(16), ForeignKey("sites.site_id"), nullable=False)
    temperature_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    humidity_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rainfall_mm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    wind_speed_kmh: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weather_condition: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    visibility_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    soil_moisture_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    soil_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    terrain_slope_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ground_condition: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    dust_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    __table_args__ = (
        Index("idx_env_site_time", "site_id", "timestamp"),
    )
