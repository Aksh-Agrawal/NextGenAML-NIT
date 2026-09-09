"""
Dedicated loguru loggers for the simulator module.

Adds three file sinks (transaction, alert, performance) filtered by a bound
``area`` extra. Safe to call multiple times (idempotent via a flag).
"""

from __future__ import annotations
from loguru import logger

from api.config import settings

_configured = False


def setup_simulator_loggers() -> None:
    """Attach the simulator file sinks to the global loguru logger."""
    global _configured
    if _configured:
        return
    _configured = True

    def area_filter(area: str):
        return lambda record: record["extra"].get("area") == area

    settings.LOGS_DIR.mkdir(parents=True, exist_ok=True)
    logger.add(
        str(settings.LOGS_DIR / "simulator.log"),
        rotation="10 MB", retention="7 days", level="INFO",
        filter=area_filter("simulator"),
    )
    logger.add(
        str(settings.LOGS_DIR / "alert.log"),
        rotation="10 MB", retention="7 days", level="INFO",
        filter=area_filter("alert"),
    )
    logger.add(
        str(settings.LOGS_DIR / "performance.log"),
        rotation="10 MB", retention="7 days", level="INFO",
        filter=area_filter("perf"),
    )


def txn_log(message: str, **kwargs) -> None:
    """Log a transaction record to logs/simulator.log."""
    setup_simulator_loggers()
    logger.bind(area="simulator").info(message, **kwargs)


def alert_log(message: str, **kwargs) -> None:
    """Log an alert to logs/alert.log."""
    setup_simulator_loggers()
    logger.bind(area="alert").warning(message, **kwargs)


def perf_log(message: str, **kwargs) -> None:
    """Log a performance / latency record to logs/performance.log."""
    setup_simulator_loggers()
    logger.bind(area="perf").debug(message, **kwargs)
