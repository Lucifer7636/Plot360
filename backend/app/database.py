"""
PLOT360 Backend — Database Engine and Session Management
SQLAlchemy 2.0 with GeoAlchemy2 for PostGIS and graceful local development fallback.
"""
import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings

logger = logging.getLogger("plot360.database")

_is_postgis = False
_active_db_url = settings.DATABASE_URL


def _build_engine():
    global _is_postgis, _active_db_url

    # Check if primary PostgreSQL is reachable (skip localhost check in cloud/Render production)
    is_cloud_prod = bool(os.environ.get("RENDER") or os.environ.get("PORT"))
    is_localhost_pg = "localhost" in settings.DATABASE_URL or "127.0.0.1" in settings.DATABASE_URL
    if settings.DATABASE_URL.startswith("postgresql") and not (is_cloud_prod and is_localhost_pg):
        try:
            test_engine = create_engine(
                settings.DATABASE_URL,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
                connect_args={"connect_timeout": 3},
            )
            with test_engine.connect() as conn:
                res = conn.execute(text("SELECT 1;")).scalar()
                if res == 1:
                    logger.info("Authoritative PostgreSQL connection established.")
                    _is_postgis = True
                    _active_db_url = settings.DATABASE_URL
                    return test_engine
        except Exception as e:
            logger.info(
                f"PostgreSQL/PostGIS at {settings.DATABASE_URL} is not available: {e}. "
                f"Falling back to local SQLite database ({settings.SQLITE_FALLBACK_URL})."
            )

    # Local fallback
    _is_postgis = False
    _active_db_url = settings.SQLITE_FALLBACK_URL
    fallback_engine = create_engine(
        settings.SQLITE_FALLBACK_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
    return fallback_engine


engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


def is_postgis_active() -> bool:
    """Returns True if connected to real PostgreSQL/PostGIS."""
    return _is_postgis


def get_active_db_url() -> str:
    """Returns active database URL."""
    return _active_db_url


def get_db():
    """FastAPI dependency: yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_postgis(db_engine=None):
    """Enable PostGIS extensions if running on PostgreSQL."""
    eng = db_engine or engine
    if _is_postgis:
        try:
            with eng.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis_topology;"))
                conn.commit()
                logger.info("PostGIS extensions enabled successfully.")
        except Exception as e:
            logger.warning(f"PostGIS extension initialization notice: {e}")
    else:
        logger.info("Running on SQLite fallback — PostGIS extensions skipped.")


def _migrate_missing_columns(eng):
    """Adds newly added columns to existing tables if missing (SQLite/PostgreSQL compatible)."""
    migrations = {
        "parcels": [
            ("state_extensions", "JSON"),
        ],
        "state_field_mappings": [
            ("mapping_id", "VARCHAR(100)"),
            ("field_type", "VARCHAR(50)"),
            ("meaning", "VARCHAR(255)"),
            ("effective_from", "VARCHAR(50)"),
            ("effective_to", "VARCHAR(50)"),
            ("created_by", "VARCHAR(100)"),
        ],
        "ai_datasets": [
            ("dataset_version", "VARCHAR(50) DEFAULT 'sentinel2-temporal-v1'"),
            ("manifest_path", "VARCHAR(500)"),
            ("dataset_fingerprint", "VARCHAR(100)"),
            ("source_root", "VARCHAR(500)"),
            ("source_file_count", "INTEGER DEFAULT 0"),
            ("raster_count", "INTEGER DEFAULT 0"),
            ("valid_count", "INTEGER DEFAULT 0"),
            ("invalid_count", "INTEGER DEFAULT 0"),
            ("pair_count", "INTEGER DEFAULT 0"),
            ("supervised_mask_count", "INTEGER DEFAULT 0"),
            ("has_supervised_masks", "BOOLEAN DEFAULT 0"),
            ("supervised_training_status", "VARCHAR(50) DEFAULT 'LABEL_BLOCKED'"),
            ("meta", "JSON"),
            ("updated_at", "DATETIME")
        ],
        "satellite_observations": [
            ("observation_id", "VARCHAR(100)"),
            ("region_id", "VARCHAR(100)"),
            ("location_name", "VARCHAR(200)"),
            ("satellite", "VARCHAR(100) DEFAULT 'Sentinel-2'"),
            ("collection", "VARCHAR(150) DEFAULT 'Sentinel-2 Surface Reflectance Harmonized'"),
            ("source_path", "VARCHAR(500)"),
            ("source_relative_path", "VARCHAR(500)"),
            ("checksum_sha256", "VARCHAR(100)"),
            ("file_size", "INTEGER"),
            ("band_count", "INTEGER DEFAULT 6"),
            ("band_metadata", "JSON"),
            ("pixel_size", "JSON"),
            ("transform", "JSON"),
            ("bounds", "JSON"),
            ("validation_status", "VARCHAR(50) DEFAULT 'VALID'"),
            ("validation_messages", "JSON"),
            ("processing_version", "VARCHAR(50) DEFAULT 'raw-v1'"),
            ("dataset_version", "VARCHAR(50) DEFAULT 'sentinel2-temporal-v1'"),
            ("classification", "VARCHAR(50) DEFAULT 'PRODUCTION'"),
            ("updated_at", "DATETIME")
        ]
    }
    try:
        with eng.connect() as conn:
            for table, cols in migrations.items():
                try:
                    res = conn.execute(text(f"PRAGMA table_info({table});")).fetchall()
                    existing_cols = {row[1] for row in res}
                    for col_name, col_type in cols:
                        if col_name not in existing_cols:
                            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type};"))
                    conn.commit()
                except Exception:
                    pass
    except Exception:
        pass


def create_tables():
    """Create all tables defined in ORM models and migrate missing columns."""
    # Ensure all models are imported
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    _migrate_missing_columns(engine)
    logger.info("Database tables verified/created.")

