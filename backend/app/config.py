"""
PLOT360 Backend — Application Configuration
Uses pydantic-settings for type-safe environment variable management.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
from pathlib import Path
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str = "postgresql://plot360:plot360secure@localhost:5432/plot360"
    SQLITE_FALLBACK_URL: str = "sqlite:///./plot360_dev.db"
    POSTGIS_ENABLED: bool = True

    # JWT Authentication
    JWT_SECRET: str = "plot360-jwt-secret-key-production-change-in-env-2026"
    SECRET_KEY: str = "plot360-jwt-secret-key-production-change-in-env-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # App Environment
    APP_ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:8000,https://plot360.onrender.com"

    # Canonical Sentinel-2 Dataset Source (Relative to Project Root by Default)
    SENTINEL_DATA_DIR: str = "PLOT360_Sentinel2_2020_2025"

    # Storage Paths
    DATA_DIR: str = "./data"
    STORAGE_PATH: str = "./data/documents"
    MODEL_PATH: str = "./data/models"
    MAX_UPLOAD_SIZE_MB: int = 50

    # OCR Configuration
    TESSERACT_CMD: str = ""

    # Optional Redis
    REDIS_URL: str = ""

    @property
    def project_root(self) -> Path:
        """Returns the project repository root (containing backend, src, PLOT360_Sentinel2_2020_2025)."""
        return Path(__file__).resolve().parent.parent.parent

    def resolve_sentinel_dir(self, override: Optional[str] = None) -> str:
        """
        Safely and dynamically resolves the canonical Sentinel-2 dataset directory.
        Works consistently across project root, backend folder, Docker mounts, and test fixtures.
        Never depends solely on current working directory.
        """
        if override is not None:
            p = Path(override)
            if p.is_absolute():
                return str(p.resolve())
            return str((self.project_root / p).resolve())

        target_path = Path(self.SENTINEL_DATA_DIR)

        # 1. Direct absolute path check
        if target_path.is_absolute() and target_path.exists():
            return str(target_path.resolve())

        # 2. Check relative to project repository root
        root_candidate = (self.project_root / target_path).resolve()
        if root_candidate.exists():
            return str(root_candidate)

        # 3. Check relative to current working directory
        cwd_candidate = (Path(os.getcwd()) / target_path).resolve()
        if cwd_candidate.exists():
            return str(cwd_candidate)

        # 4. Check backend/data/imagery/raw
        alt_candidate = (self.project_root / "PLOT360_Sentinel2_2020_2025").resolve()
        if alt_candidate.exists():
            return str(alt_candidate)

        # Fallback to resolved project root path
        return str(root_candidate)

    @property
    def sentinel_dir(self) -> str:
        return self.resolve_sentinel_dir()

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def datasets_dir(self) -> str:
        return os.path.join(self.DATA_DIR, "datasets")

    @property
    def imagery_dir(self) -> str:
        return os.path.join(self.DATA_DIR, "imagery")

    @property
    def raw_imagery_dir(self) -> str:
        return os.path.join(self.DATA_DIR, "imagery", "raw")

    @property
    def processed_imagery_dir(self) -> str:
        return os.path.join(self.DATA_DIR, "imagery", "processed")

    @property
    def predictions_dir(self) -> str:
        return os.path.join(self.DATA_DIR, "imagery", "predictions")

    @property
    def masks_dir(self) -> str:
        return os.path.join(self.DATA_DIR, "masks")

    @property
    def models_dir(self) -> str:
        return os.path.join(self.DATA_DIR, "models")

    @property
    def exports_dir(self) -> str:
        return os.path.join(self.DATA_DIR, "exports")

    @property
    def documents_dir(self) -> str:
        return os.path.join(self.DATA_DIR, "documents")


settings = Settings()

