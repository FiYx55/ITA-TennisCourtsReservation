import uuid

from sqlalchemy import String, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column

from court_service.database import Base


class Court(Base):
    __tablename__ = "courts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    surface: Mapped[str] = mapped_column(String(10), nullable=False)
    is_indoor: Mapped[bool] = mapped_column(Boolean, default=False)
    hourly_rate: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
