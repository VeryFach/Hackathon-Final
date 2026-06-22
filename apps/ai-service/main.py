from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

app = FastAPI(
    title="AI Agent App",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware
)


@app.get("/health")
async def health():
    return {"status": "ok"}

@app.head('/')
async def head_root():
    return PlainTextResponse("")