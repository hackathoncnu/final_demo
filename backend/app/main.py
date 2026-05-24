from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

load_dotenv(override=True)

from .database import Base, engine
from .limiter import limiter
from .routes import missing

Base.metadata.create_all(bind=engine)

app = FastAPI(title="zi-bro API (Secure)", description="치매 노인 실종자 매칭 서비스")

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """HTTP Security 헤더 — Clickjacking / MIME sniffing / XSS / Referrer 보호."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """전역 예외 처리 — 내부 구현 세부 정보 노출 차단."""
    if isinstance(exc, RateLimitExceeded):
        raise exc
    return JSONResponse(
        status_code=500,
        content={"detail": "서버 내부 오류가 발생했습니다."},
    )


app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(missing.router)


@app.get("/")
def root():
    return {"message": "zi-bro API 작동 중"}
