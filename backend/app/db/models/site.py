from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class Site(Base):
    __tablename__ = "sites"

    site_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    site_name: Mapped[str] = mapped_column(String(100))
    site_type: Mapped[str] = mapped_column(String(50))
    location_region: Mapped[str] = mapped_column(String(50))
    terrain_type: Mapped[str] = mapped_column(String(50))
    elevation_m: Mapped[float] = mapped_column(Float)
    average_slope_percent: Mapped[float] = mapped_column(Float)
    ground_type: Mapped[str] = mapped_column(String(50))
