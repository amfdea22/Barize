"""
BARIZE - Request Metrics Middleware
Tracks request count, duration, and error rates per endpoint.
"""

import time
from collections import defaultdict
from threading import Lock
from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class MetricsStore:
    def __init__(self):
        self._lock = Lock()
        self._requests = defaultdict(lambda: {"count": 0, "errors": 0, "total_duration": 0.0})

    def record(self, method: str, path: str, duration: float, status_code: int):
        key = f"{method} {path}"
        with self._lock:
            self._requests[key]["count"] += 1
            self._requests[key]["total_duration"] += duration
            if status_code >= 400:
                self._requests[key]["errors"] += 1

    def snapshot(self) -> dict:
        with self._lock:
            return dict(self._requests)


metrics_store = MetricsStore()


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response: Response = await call_next(request)
        duration = time.perf_counter() - start

        route = request.url.path
        if not route.startswith("/api"):
            return response

        metrics_store.record(request.method, route, duration, response.status_code)
        return response


def setup_metrics_middleware(app: FastAPI):
    app.add_middleware(MetricsMiddleware)
