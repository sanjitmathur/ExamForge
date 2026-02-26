from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings


class Base(DeclarativeBase):
    pass


# asyncpg doesn't understand Neon's query params (sslmode, channel_binding, etc.)
# Strip them and pass ssl=require via connect_args instead
_async_url = settings.DATABASE_URL.split("?")[0]
_async_connect_args = {"ssl": "require"} if "postgresql" in settings.DATABASE_URL else {}

# Async engine for API routes
async_engine = create_async_engine(_async_url, echo=False, connect_args=_async_connect_args)
AsyncSessionLocal = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

# Sync engine for background threads
sync_engine = create_engine(settings.SYNC_DATABASE_URL, echo=False)
SyncSessionLocal = sessionmaker(bind=sync_engine)


# Enable WAL mode for SQLite only
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(sync_engine, "connect")
    def set_sqlite_pragma_sync(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

    @event.listens_for(async_engine.sync_engine, "connect")
    def set_sqlite_pragma_async(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # SQLite-only migrations (Postgres gets correct schema from create_all)
        if settings.DATABASE_URL.startswith("sqlite"):
            # Migrate existing DBs: add role column if missing
            try:
                await conn.execute(
                    text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'")
                )
            except Exception:
                pass  # Column already exists
            # Set existing users (who have NULL role) to admin
            await conn.execute(
                text("UPDATE users SET role = 'admin' WHERE role IS NULL")
            )
            # Migrate: add plain_password column if missing
            try:
                await conn.execute(
                    text("ALTER TABLE users ADD COLUMN plain_password VARCHAR(255)")
                )
            except Exception:
                pass  # Column already exists
