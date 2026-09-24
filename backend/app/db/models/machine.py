from sqlalchemy import String, Float, Integer, BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class Machine(Base):
    __tablename__ = "machines"

    machine_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    machine_type: Mapped[str] = mapped_column(String(50))
    machine_model: Mapped[str] = mapped_column(String(50))
    manufacturer: Mapped[str] = mapped_column(String(50))
    manufacturing_year: Mapped[int] = mapped_column(Integer)
    machine_age_years: Mapped[float] = mapped_column(Float)
    engine_type: Mapped[str] = mapped_column(String(50))
    rated_power_kw: Mapped[float] = mapped_column(Float)
    fuel_capacity_l: Mapped[float] = mapped_column(Float)
    operating_weight_kg: Mapped[int] = mapped_column(BigInteger)
    site_id: Mapped[str] = mapped_column(String(16), ForeignKey("sites.site_id"))
    status: Mapped[str] = mapped_column(String(50))
