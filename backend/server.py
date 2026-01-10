from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone

# Configure logging early
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment FIRST
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import services after loading env
from ai_service import ai_service
from media_service import media_service

# Try to import pptx_service (may fail without all dependencies)
try:
    from pptx_service import pptx_service
    PPTX_AVAILABLE = True
except ImportError:
    PPTX_AVAILABLE = False
    logger.warning("PPTX service not available")

# Try to import rnd_models
try:
    from rnd_models import (
        INITIAL_PAPERS, INITIAL_EQUIPMENT, INITIAL_MATERIALS, INITIAL_INSTITUTIONS,
        CATEGORIES, COUNTRIES
    )
except ImportError:
    INITIAL_PAPERS = []
    INITIAL_EQUIPMENT = []
    INITIAL_MATERIALS = []
    INITIAL_INSTITUTIONS = []
    CATEGORIES = []
    COUNTRIES = []

# MongoDB connection - OPTIONAL for demo mode
mongo_url = os.environ.get('MONGO_URL', '')
db_name = os.environ.get('DB_NAME', 'chathdi')
USE_MONGODB = bool(mongo_url and mongo_url != 'mongodb://localhost:27017/')

db = None
client = None

if USE_MONGODB:
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        
        mongo_options = {
            'serverSelectionTimeoutMS': 5000,
            'connectTimeoutMS': 10000,
            'socketTimeoutMS': 10000,
        }
        
        if 'mongodb+srv://' in mongo_url or 'mongodb.net' in mongo_url:
            mongo_options['tls'] = True
            mongo_options['tlsAllowInvalidCertificates'] = False
            logger.info("MongoDB Atlas detected, TLS enabled")
        
        client = AsyncIOMotorClient(mongo_url, **mongo_options)
        db = client[db_name]
        logger.info("MongoDB client initialized")
    except Exception as e:
        logger.warning(f"MongoDB not available, using in-memory mode: {e}")
        USE_MONGODB = False
else:
    logger.info("Running in demo mode (no MongoDB)")

# In-memory storage for demo mode
in_memory_db = {
    "status_checks": [],
    "rnd_papers": list(INITIAL_PAPERS),
    "rnd_equipment": list(INITIAL_EQUIPMENT),
    "rnd_materials": list(INITIAL_MATERIALS),
    "rnd_institutions": list(INITIAL_INSTITUTIONS),
    "master_prompts": []
}


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if USE_MONGODB and db:
        try:
            await db.command("ping")
            logger.info("MongoDB connection established successfully")
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
    else:
        logger.info("Running in demo mode with in-memory storage")
    yield
    # Shutdown
    if client:
        client.close()
        logger.info("MongoDB connection closed")


# Create the main app with lifespan
app = FastAPI(
    title="ChatHDI API", 
    description="AI-powered chat for R&D Engineering",
    version="2.3.0",
    lifespan=lifespan
)

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "hdi-4"  # hdi-4, hdi-4-mini, hdi-vision, hdi-code

class ChatResponse(BaseModel):
    response: str
    model: str
    media_type: Optional[str] = None  # 'image', 'video', or None
    media_data: Optional[List[str]] = None  # base64 encoded media

class ImageGenRequest(BaseModel):
    prompt: str
    model: str = "dall-e-3"

class VideoGenRequest(BaseModel):
    prompt: str
    model: str = "sora"

class PPTXRequest(BaseModel):
    topic: str


# Basic routes
@api_router.get("/")
async def root():
    return {"message": "ChatHDI API - Ready", "mode": "mongodb" if USE_MONGODB else "demo"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint for deployment"""
    health_status = {
        "status": "healthy",
        "version": "2.3.0",
        "mode": "mongodb" if USE_MONGODB else "demo"
    }
    
    if USE_MONGODB and db:
        try:
            await db.command("ping")
            health_status["database"] = "connected"
        except Exception as e:
            health_status["database"] = "disconnected"
            health_status["db_error"] = str(e)
    else:
        health_status["database"] = "in-memory"
    
    return health_status

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    if USE_MONGODB and db:
        await db.status_checks.insert_one(doc)
    else:
        in_memory_db["status_checks"].append(doc)
    
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    if USE_MONGODB and db:
        status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    else:
        status_checks = in_memory_db["status_checks"]
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


# Chat endpoint - Main AI functionality
@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to ChatHDI and get AI-powered response
    Automatically detects image/video generation requests
    
    Models:
    - hdi-4: GPT-4o (most capable)
    - hdi-4-mini: GPT-4o-mini (faster)
    - hdi-vision: Claude (best analysis)
    - hdi-code: Claude (best for code)
    """
    try:
        # Convert messages to dict format
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Get last user message
        last_message = messages[-1]["content"] if messages else ""
        
        # Check if user is requesting media generation
        media_type, media_prompt = media_service.detect_media_request(last_message)
        
        # Override detection if specific media model is selected
        if request.model == 'hdi-image' or request.model == 'hdi-image-flux':
            media_type = 'image'
            media_prompt = last_message
        elif request.model == 'hdi-video':
            media_type = 'video'
            media_prompt = last_message
        
        if media_type == 'image':
            # Generate image
            result = await media_service.generate_image(media_prompt)
            if result['success']:
                return ChatResponse(
                    response=f"Saya telah membuat gambar berdasarkan permintaan: \"{media_prompt[:100]}...\"",
                    model=result['model'],
                    media_type="image",
                    media_data=result['images']
                )
            else:
                # Fallback to text response
                response = await ai_service.chat(messages, request.model)
                return ChatResponse(
                    response=f"Maaf, gagal membuat gambar: {result['error']}\n\nSebagai gantinya, berikut penjelasan:\n\n{response}",
                    model=request.model
                )
        
        elif media_type == 'video':
            # Generate video
            result = await media_service.generate_video(media_prompt)
            if result['success']:
                return ChatResponse(
                    response=f"Saya telah membuat video berdasarkan permintaan: \"{media_prompt}\"",
                    model=result['model'],
                    media_type="video",
                    media_data=[result['video_base64']]
                )
            else:
                # Fallback to text response
                # response = await ai_service.chat(messages, request.model)
                return ChatResponse(
                    # response=f"Maaf, gagal membuat video: {result['error']}\n\nSebagai gantinya, berikut penjelasan:\n\n{response}",
                    response=f"❌ **Gagal Membuat Video**\n\nDetail Error:\n`{result['error']}`\n\nSilakan coba lagi atau cek konfigurasi API.",
                    model=request.model
                )
        
        # Regular text chat
        response = await ai_service.chat(messages, request.model)
        return ChatResponse(response=response, model=request.model)
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return ChatResponse(
            response=f"Maaf, terjadi kesalahan: {str(e)}",
            model=request.model
        )


# Dedicated Image Generation Endpoint
@api_router.post("/generate/image")
async def generate_image(request: ImageGenRequest):
    """Generate image using DALL-E"""
    try:
        result = await media_service.generate_image(request.prompt, request.model)
        return result
    except Exception as e:
        logger.error(f"Image generation error: {e}")
        return {"success": False, "error": str(e)}


# Dedicated Video Generation Endpoint
@api_router.post("/generate/video")
async def generate_video(request: VideoGenRequest):
    """Generate video (requires special API access)"""
    try:
        result = await media_service.generate_video(request.prompt, request.model)
        return result
    except Exception as e:
        logger.error(f"Video generation error: {e}")
        return {"success": False, "error": str(e)}


# PPTX Generation Endpoint
@api_router.post("/generate/pptx")
async def generate_pptx(request: PPTXRequest):
    """Generate PowerPoint presentation from topic using AI"""
    if not PPTX_AVAILABLE:
        return {"success": False, "error": "PPTX service not available"}
    try:
        result = await pptx_service.generate_from_topic(request.topic, ai_service)
        return result
    except Exception as e:
        logger.error(f"PPTX generation error: {e}")
        return {"success": False, "error": str(e)}


# ============ R&D DATABASE ENDPOINTS ============

@api_router.get("/rnd/all")
async def get_all_rnd_data():
    """Get all R&D database data"""
    try:
        if USE_MONGODB and db:
            papers = await db.rnd_papers.find({}, {"_id": 0}).to_list(1000)
            equipment = await db.rnd_equipment.find({}, {"_id": 0}).to_list(1000)
            materials = await db.rnd_materials.find({}, {"_id": 0}).to_list(1000)
            institutions = await db.rnd_institutions.find({}, {"_id": 0}).to_list(1000)
        else:
            papers = in_memory_db["rnd_papers"]
            equipment = in_memory_db["rnd_equipment"]
            materials = in_memory_db["rnd_materials"]
            institutions = in_memory_db["rnd_institutions"]
        
        return {
            "papers": papers,
            "equipment": equipment,
            "materials": materials,
            "institutions": institutions,
            "categories": CATEGORIES,
            "countries": COUNTRIES,
            "lastUpdated": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Get all RnD data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/rnd/papers")
async def get_papers():
    """Get all research papers"""
    if USE_MONGODB and db:
        papers = await db.rnd_papers.find({}, {"_id": 0}).to_list(1000)
    else:
        papers = in_memory_db["rnd_papers"]
    return {"papers": papers, "count": len(papers)}


@api_router.get("/rnd/equipment")
async def get_equipment():
    """Get all lab equipment"""
    if USE_MONGODB and db:
        equipment = await db.rnd_equipment.find({}, {"_id": 0}).to_list(1000)
    else:
        equipment = in_memory_db["rnd_equipment"]
    return {"equipment": equipment, "count": len(equipment)}


@api_router.get("/rnd/materials")
async def get_materials():
    """Get all materials"""
    if USE_MONGODB and db:
        materials = await db.rnd_materials.find({}, {"_id": 0}).to_list(1000)
    else:
        materials = in_memory_db["rnd_materials"]
    return {"materials": materials, "count": len(materials)}


@api_router.get("/rnd/institutions")
async def get_institutions():
    """Get all institutions"""
    if USE_MONGODB and db:
        institutions = await db.rnd_institutions.find({}, {"_id": 0}).to_list(1000)
    else:
        institutions = in_memory_db["rnd_institutions"]
    return {"institutions": institutions, "count": len(institutions)}


# ============ MASTER PROMPT ENGINEERING ENDPOINTS ============

@api_router.get("/prompts/master")
async def get_master_prompts():
    """Get all master prompt engineering templates"""
    try:
        default_prompts = media_service.get_master_prompts()
        return {"prompts": list(default_prompts.values()), "source": "default"}
    except Exception as e:
        logger.error(f"Get master prompts error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Include the router in the main app
app.include_router(api_router)
