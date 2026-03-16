import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request

from court_service.database import engine, Base
from court_service.controllers import court_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("court_service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Court Service")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")
    yield
    logger.info("Shutting down Court Service")


app = FastAPI(title="Court Service", lifespan=lifespan)
app.include_router(court_router)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("%s %s", request.method, request.url.path)
    response = await call_next(request)
    logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
    return response


@app.get("/health")
async def health():
    return {"status": "ok"}
