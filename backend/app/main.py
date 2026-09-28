"""
PLOT360 Backend — FastAPI Application Entry Point
Sections 38, 39, 40, 106, 124, 125:
All application routes versioned under /api/v1, Request-ID tracing,
structured error responses, and CORS configuration.
"""
import os
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.utils.request_id import RequestIdMiddleware
from app.utils.logging import logger

# Routers
from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.parcels import router as parcels_router
from app.routers.governance import router as governance_router
from app.routers.planning import router as planning_router
from app.routers.taxation import router as taxation_router
from app.routers.utilities import router as utilities_router
from app.routers.search import router as search_router
from app.routers.citizen import router as citizen_router, applications_router
from app.routers.workflows import router as workflows_router
from app.routers.documents import router as documents_router
from app.routers.ai import router as ai_router
from app.routers.analytics import router as analytics_router
from app.routers.integrations import router as integrations_router
from app.routers.notifications import router as notifications_router
from app.routers.admin import router as admin_router
from app.routers.demo import router as demo_router
from app.routers.gis import router as gis_router
from app.routers.conflicts import router as conflicts_router
from app.routers.duplicates import router as duplicates_router
from app.routers.localization import router as localization_router


app = FastAPI(
    title="PLOT360 — Land Governance Platform API",
    description=(
        "Production-grade Backend REST API for PLOT360: From Boundaries to Insights.\n\n"
        "Parcel-centric governance operating platform linking ULPIN with ownership, "
        "RoR, registration, planning, building permissions, property tax, utilities, "
        "citizen services, workflows, audit provenance, GIS, and temporal AI change detection.\n\n"
        "**Authoritative spatial engine: PostgreSQL + PostGIS with local development fallback.**"
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── Middlewares ───────────────────────────────────────────────────────────────
app.add_middleware(RequestIdMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in settings.cors_origins_list if o and o != "*"],
    allow_origin_regex=r"^https://.*(\.vercel\.app|\.pages\.dev|\.onrender\.com)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Structured Error Handlers (Sections 39 & 106) ─────────────────────────────
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    req_id = getattr(request.state, "request_id", None)
    error_code = "HTTP_ERROR"
    if exc.status_code == 404:
        error_code = "RESOURCE_NOT_FOUND"
    elif exc.status_code == 401:
        error_code = "AUTHENTICATION_ERROR"
    elif exc.status_code == 403:
        error_code = "PERMISSION_DENIED"
    elif exc.status_code == 409:
        error_code = "CONFLICT_ERROR"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": error_code,
            "message": exc.detail,
            "request_id": req_id
        },
        headers={"X-Request-ID": req_id} if req_id else None
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Invalid request parameters or payload",
            "request_id": req_id,
            "details": exc.errors()
        },
        headers={"X-Request-ID": req_id} if req_id else None
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", None)
    logger.error(f"Unhandled server error [request_id={req_id}]: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An internal server error occurred. Please contact administrator.",
            "request_id": req_id
        },
        headers={"X-Request-ID": req_id} if req_id else None
    )


# ── Mounting Application Routers (Prefix /api/v1) ─────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(health_router, prefix=API_PREFIX)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(parcels_router, prefix=API_PREFIX)
app.include_router(gis_router, prefix=API_PREFIX)
app.include_router(governance_router, prefix=API_PREFIX)
app.include_router(planning_router, prefix=API_PREFIX)
app.include_router(taxation_router, prefix=API_PREFIX)
app.include_router(utilities_router, prefix=API_PREFIX)
app.include_router(search_router, prefix=API_PREFIX)
app.include_router(citizen_router, prefix=API_PREFIX)
app.include_router(applications_router, prefix=API_PREFIX)
app.include_router(workflows_router, prefix=API_PREFIX)
app.include_router(documents_router, prefix=API_PREFIX)
app.include_router(conflicts_router, prefix=API_PREFIX)
app.include_router(duplicates_router, prefix=API_PREFIX)
app.include_router(ai_router, prefix=API_PREFIX)
app.include_router(analytics_router, prefix=API_PREFIX)
app.include_router(integrations_router, prefix=API_PREFIX)
app.include_router(notifications_router, prefix=API_PREFIX)
app.include_router(localization_router, prefix=API_PREFIX)
app.include_router(demo_router, prefix=API_PREFIX)
app.include_router(admin_router, prefix=API_PREFIX)



# ── Lifecycle & Startup ───────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    logger.info("Starting PLOT360 backend platform...")
    # Ensure data storage directories exist
    for d in [settings.raw_imagery_dir, settings.processed_imagery_dir,
              settings.predictions_dir, settings.masks_dir, settings.models_dir,
              settings.documents_dir]:
        os.makedirs(d, exist_ok=True)

    try:
        from app.database import init_postgis, create_tables
        init_postgis()
        create_tables()
        logger.info("Database schemas verified.")
    except Exception as e:
        logger.warning(f"Database initialization note: {e}")

    logger.info(f"PLOT360 Backend operational — env={settings.APP_ENV}")


# ── Serve Production Built Frontend ───────────────────────────────────────────
dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "dist"))
if os.path.isdir(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static_frontend")
else:
    @app.get("/", include_in_schema=False)
    def root():
        return JSONResponse({
            "name": "PLOT360 — Land Governance Platform API",
            "version": "1.0.0",
            "docs": "/api/docs",
            "health": "/api/v1/health",
            "note": "Authoritative parcel-centric backend. PostGIS production with local SQLite dev fallback."
        })
