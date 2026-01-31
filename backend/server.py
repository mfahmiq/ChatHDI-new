from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Union, Any
import uuid
import platform
from datetime import datetime, timezone

# Configure logging early
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

import sys

# Load environment FIRST
if getattr(sys, 'frozen', False):
    # Run from PyInstaller exe
    ROOT_DIR = Path(sys.executable).parent
else:
    # Run from script
    ROOT_DIR = Path(__file__).parent

# Try to load .env from ROOT_DIR or current directory
env_path = ROOT_DIR / '.env'
if env_path.exists():
    load_dotenv(env_path)
    logger.info(f"Loaded .env from {env_path}")
else:
    load_dotenv() # Try default locations
    logger.info(f".env not found at {env_path}, trying default load")

# Import services after loading env
from ai_service import ai_service
from media_service import media_service
from document_service import document_service
from fastapi import UploadFile, File

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
    ensure_data_dir()
    if USE_MONGODB and db:
        try:
            await db.command("ping")
            logger.info("MongoDB connection established successfully")
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
    else:
        logger.info("Running in local file mode (JSON persistence)")
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


# ============ PERSISTENCE UTILS ============
import json
import shutil

def get_data_dir():
    """Get the application data directory provided by OS"""
    system = platform.system()
    if system == "Windows":
        base_path = Path(os.environ.get("APPDATA")) / "ChatHDI"
    elif system == "Darwin":
        base_path = Path.home() / "Library" / "Application Support" / "ChatHDI"
    else:
        base_path = Path.home() / ".config" / "chathdi"
    
    return base_path / "data"

DATA_DIR = get_data_dir()
CONVERSATIONS_FILE = DATA_DIR / "conversations.json"

def ensure_data_dir():
    """Ensure data directory exists"""
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not CONVERSATIONS_FILE.exists():
            with open(CONVERSATIONS_FILE, 'w', encoding='utf-8') as f:
                json.dump([], f)
        logger.info(f"Data directory: {DATA_DIR}")
    except Exception as e:
        logger.error(f"Failed to create data directory: {e}")

def load_conversations_from_file():
    """Load conversations from JSON file"""
    try:
        if CONVERSATIONS_FILE.exists():
            with open(CONVERSATIONS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    except Exception as e:
        logger.error(f"Error loading conversations: {e}")
        return []

def save_conversations_to_file(conversations):
    """Save conversations to JSON file"""
    try:
        with open(CONVERSATIONS_FILE, 'w', encoding='utf-8') as f:
            json.dump(conversations, f, default=str)
        return True
    except Exception as e:
        logger.error(f"Error saving conversations: {e}")
        return False


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
    content: Any # Allow string or list of dicts (for images)
    timestamp: Optional[str] = None
    mediaType: Optional[str] = None
    mediaData: Optional[List[str]] = None

class Conversation(BaseModel):
    id: str
    title: str
    messages: List[Dict]
    timestamp: Optional[Union[datetime, str]] = None
    projectId: Optional[str] = None
    isPinned: bool = False

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
@api_router.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    """Upload and parse a document (PDF, DOCX, CSV, Excel, TXT)"""
    try:
        parsed_text = await document_service.parse_document(file)
        return {"success": True, "filename": file.filename, "content": parsed_text}
    except Exception as e:
        logger.error(f"Upload document error: {e}")
        return {"success": False, "error": str(e)}

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


# ============ CONVERSATION ENDPOINTS ============

@api_router.get("/conversations", response_model=List[Dict])
async def get_conversations():
    """Get all saved conversations"""
    return load_conversations_from_file()

@api_router.post("/conversations")
async def save_conversation(conversation: Conversation):
    """Save or update a conversation"""
    conversations = load_conversations_from_file()
    
    # Check if exists, update if so, else append
    existing_idx = next((i for i, c in enumerate(conversations) if c['id'] == conversation.id), -1)
    
    conv_data = conversation.model_dump()
    # Ensure timestamp is string
    if isinstance(conv_data.get('timestamp'), datetime):
        conv_data['timestamp'] = conv_data['timestamp'].isoformat()
    
    if existing_idx >= 0:
        conversations[existing_idx] = conv_data
    else:
        conversations.insert(0, conv_data)  # Add to top
        
    save_conversations_to_file(conversations)
    return conv_data

@api_router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    conversations = load_conversations_from_file()
    conversations = [c for c in conversations if c['id'] != conversation_id]
    save_conversations_to_file(conversations)
    return {"success": True, "id": conversation_id}


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
        last_message = ""
        if messages:
            raw_content = messages[-1]["content"]
            if isinstance(raw_content, str):
                last_message = raw_content
            elif isinstance(raw_content, list):
                # Extract text from multimodal content
                for part in raw_content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        last_message += part.get("text", "") + " "
                last_message = last_message.strip()
        
        # Check if user is requesting media generation
        # Skip detection if message is very long (likely contains RAG context) to prevent false positives
        if len(last_message) > 500:
             media_type, media_prompt = None, None
        else:
             media_type, media_prompt = media_service.detect_media_request(last_message)
        
        # Override detection if specific media model is selected
        if request.model == 'hdi-image' or request.model == 'hdi-image-flux':
            media_type = 'image'
            media_prompt = last_message
        elif request.model == 'hdi-video':
            media_type = 'video'
            media_prompt = last_message
        
        # if media_type == 'image':
        #     # Generate image
        #     result = await media_service.generate_image(media_prompt)
        #     if result['success']:
        #         return ChatResponse(
        #             response=f"Saya telah membuat gambar berdasarkan permintaan: \"{media_prompt[:100]}...\"",
        #             model=result['model'],
        #             media_type="image",
        #             media_data=result['images']
        #         )
        #     else:
        #         # Fallback to text response
        #         response = await ai_service.chat(messages, request.model)
        #         return ChatResponse(
        #             response=f"Maaf, gagal membuat gambar: {result['error']}\n\nSebagai gantinya, berikut penjelasan:\n\n{response}",
        #             model=request.model
        #         )
        
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
# Include the router in the main app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    # Use 0.0.0.0 to allow access from other machines if needed, or 127.0.0.1 for local only
    uvicorn.run(app, host="127.0.0.1", port=8000)
