"""
Media Generation Service for ChatHDI
Supports: Image generation (Hugging Face + OpenAI DALL-E), Video generation (placeholder)
Includes: Master Prompt Engineering for technical/CAD visualizations
"""

import os
import base64
import re
import io
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict
import httpx

# Load environment variables first
from dotenv import load_dotenv
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Try to import OpenAI
try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Try to import Hugging Face
try:
    from huggingface_hub import InferenceClient
    HUGGINGFACE_AVAILABLE = True
except ImportError:
    HUGGINGFACE_AVAILABLE = False
    logger.warning("huggingface_hub not installed. Run: pip install huggingface_hub")

# Get API Keys (after loading .env)
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
HUGGINGFACE_API_KEY = os.environ.get('HUGGINGFACE_API_KEY', '')

if not OPENAI_API_KEY and EMERGENT_KEY:
    OPENAI_API_KEY = EMERGENT_KEY

# Log API key status
if HUGGINGFACE_API_KEY:
    logger.info(f"HUGGINGFACE_API_KEY loaded: {HUGGINGFACE_API_KEY[:10]}...")
else:
    logger.warning("HUGGINGFACE_API_KEY not found in environment")

# Hugging Face Models for image generation
HF_IMAGE_MODELS = {
    "sdxl": "stabilityai/stable-diffusion-xl-base-1.0",
    "sd-2.1": "stabilityai/stable-diffusion-2-1", 
    "flux": "black-forest-labs/FLUX.1-schnell",
    "default": "stabilityai/stable-diffusion-xl-base-1.0",
    # Frontend model IDs (from dropdown)
    "hdi-image": "stabilityai/stable-diffusion-xl-base-1.0",
    "hdi-image-flux": "black-forest-labs/FLUX.1-schnell"
}

# Hugging Face Models for video generation
HF_VIDEO_MODELS = {
    "text-to-video": "cerspense/zeroscope_v2_576w",
    "default": "cerspense/zeroscope_v2_576w",
    # Frontend model IDs (from dropdown)
    "hdi-video": "cerspense/zeroscope_v2_576w",
    "ali-vilab": "ali-vilab/text-to-video-ms-1.7b" # Keep as backup/reference
}


# ============ MASTER PROMPT ENGINEERING TEMPLATES ============

MASTER_PROMPTS = {
    "engineering_cad": {
        "id": "engineering_cad",
        "name": "Engineering CAD Visualization",
        "description": "High-quality industrial CAD rendering untuk komponen teknik",
        "template": """High-detail industrial CAD rendering of {OBJECT_NAME}, designed for {TECHNICAL_FUNCTION}, following mechanical engineering standards.

The model is created in professional CAD style (SolidWorks / AutoCAD / Fusion 360 / CATIA), with precise dimensions, correct tolerances, and realistic mechanical assembly.

Features include accurate geometry, sharp edges, chamfers, fillets, bolt holes, threads, bearings, and mounting points, fully aligned and manufacturable.

Rendered in industrial environment, neutral background, engineering visualization, no artistic distortion.

Materials are physically accurate: {MATERIALS}.

Lighting is technical and uniform, emphasizing edges, depth, and part separation.

Style is technical documentation quality, clean, professional, realistic, suitable for manufacturing and engineering review.

{ADDITIONAL_SPECS}""",
        "default_materials": "brushed steel, anodized aluminum, cast iron, rubber seals, industrial plastic",
        "keywords": ["cad", "engineering", "mechanical", "teknik", "mesin", "komponen", "part", "assembly", 
                    "reactor", "reaktor", "furnace", "valve", "pump", "pompa", "tank", "tangki",
                    "electrolyzer", "elektroliser", "fuel cell", "heat exchanger", "penukar panas",
                    "piping", "pipa", "flange", "bearing", "gear", "shaft", "motor"]
    },
    
    "hydrogen_equipment": {
        "id": "hydrogen_equipment",
        "name": "Hydrogen Equipment Visualization",
        "description": "Visualisasi peralatan produksi dan penyimpanan hidrogen",
        "template": """High-detail industrial visualization of {OBJECT_NAME}, a hydrogen {EQUIPMENT_TYPE} system designed for {TECHNICAL_FUNCTION}.

Professional engineering rendering showing:
- Main components: {MAIN_COMPONENTS}
- Operating conditions: {OPERATING_CONDITIONS}
- Safety features: pressure relief valves, leak detection, ventilation systems

CAD-quality visualization with accurate proportions, proper material representation, and industrial standard compliance.

Materials: stainless steel 316L for hydrogen contact surfaces, carbon steel for structural elements, specialized seals and gaskets for hydrogen service.

Clean industrial background, technical lighting, engineering documentation quality.

{ADDITIONAL_SPECS}""",
        "keywords": ["hidrogen", "hydrogen", "elektrolisis", "electrolysis", "pem", "soec", "alkaline",
                    "storage", "penyimpanan", "fuel cell", "h2", "green hydrogen", "blue hydrogen"]
    },
    
    "process_flow_diagram": {
        "id": "process_flow_diagram",
        "name": "Process Flow Diagram",
        "description": "Diagram alir proses industri",
        "template": """Professional Process Flow Diagram (PFD) for {PROCESS_NAME}.

Clear engineering diagram showing:
- Process units: {PROCESS_UNITS}
- Flow directions with arrows
- Major equipment symbols (ISO/ANSI standards)
- Stream labels and flow rates
- Operating parameters

Style: Technical P&ID/PFD standard, clean lines, proper symbols, readable labels.
Color coding: Process streams in blue, utilities in green, products in yellow.
Background: White/light gray engineering paper style.

{ADDITIONAL_SPECS}""",
        "keywords": ["diagram alir", "flow diagram", "pfd", "p&id", "proses", "process flow", 
                    "alur", "flowchart teknik", "diagram proses"]
    },
    
    "technical_illustration": {
        "id": "technical_illustration",
        "name": "Technical Illustration",
        "description": "Ilustrasi teknis untuk dokumentasi",
        "template": """Professional technical illustration of {OBJECT_NAME} for engineering documentation.

Detailed cutaway/exploded view showing:
- Internal components and assembly
- Part numbering and callouts
- Dimensional annotations
- Material specifications

Style: Technical manual quality, isometric or orthographic projection.
Clean lines, precise geometry, professional appearance.
Suitable for manufacturing documentation and training materials.

{ADDITIONAL_SPECS}""",
        "keywords": ["ilustrasi teknis", "technical drawing", "gambar teknik", "cutaway", 
                    "exploded view", "assembly drawing", "detail drawing"]
    }
}


class MediaService:
    """Service for generating images and videos with Master Prompt Engineering"""
    
    def __init__(self):
        self.openai_client = None
        self.hf_client = None
        
        # Initialize OpenAI client
        if OPENAI_AVAILABLE and OPENAI_API_KEY:
            self.openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        
        # Initialize Hugging Face client
        if HUGGINGFACE_AVAILABLE and HUGGINGFACE_API_KEY:
            self.hf_client = InferenceClient(token=HUGGINGFACE_API_KEY)
            logger.info("Hugging Face client initialized for image generation")
        else:
            logger.warning("HUGGINGFACE_API_KEY not set - Hugging Face features will not work")
        
        self.master_prompts = MASTER_PROMPTS
    
    def detect_engineering_context(self, message: str) -> Tuple[Optional[str], Dict]:
        """
        Detect if message is requesting engineering/technical visualization
        Returns: (template_id, extracted_parameters)
        """
        message_lower = message.lower()
        
        # Check each master prompt template
        for template_id, template_data in self.master_prompts.items():
            for keyword in template_data["keywords"]:
                if keyword in message_lower:
                    # Extract parameters from message
                    params = self._extract_parameters(message, template_id)
                    return (template_id, params)
        
        return (None, {})
    
    def _extract_parameters(self, message: str, template_id: str) -> Dict:
        """Extract relevant parameters from user message"""
        params = {}
        
        # Extract object name (usually after "gambar" or main keyword)
        object_patterns = [
            r'gambar(?:kan)?\s+(.+?)(?:\s+untuk|\s+dengan|\s+yang|\.|$)',
            r'buatkan?\s+(?:gambar\s+)?(.+?)(?:\s+untuk|\s+dengan|\.|$)',
            r'visualisasi\s+(.+?)(?:\s+untuk|\s+dengan|\.|$)',
            r'ilustrasi\s+(.+?)(?:\s+untuk|\s+dengan|\.|$)',
        ]
        
        for pattern in object_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                params['OBJECT_NAME'] = match.group(1).strip()
                break
        
        if 'OBJECT_NAME' not in params:
            # Use cleaned message as object name
            params['OBJECT_NAME'] = message.replace('buatkan gambar', '').replace('buat gambar', '').strip()
        
        # Extract function/purpose
        function_patterns = [
            r'untuk\s+(.+?)(?:\s+dengan|\.|$)',
            r'fungsi\s+(.+?)(?:\s+dengan|\.|$)',
        ]
        
        for pattern in function_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                params['TECHNICAL_FUNCTION'] = match.group(1).strip()
                break
        
        # Set defaults based on template
        if template_id == "engineering_cad":
            params.setdefault('TECHNICAL_FUNCTION', 'industrial application and manufacturing')
            params.setdefault('MATERIALS', self.master_prompts[template_id]['default_materials'])
            params.setdefault('ADDITIONAL_SPECS', '')
        
        elif template_id == "hydrogen_equipment":
            params.setdefault('EQUIPMENT_TYPE', 'production/storage')
            params.setdefault('TECHNICAL_FUNCTION', 'hydrogen generation and handling')
            params.setdefault('MAIN_COMPONENTS', 'electrolyzer stack, power supply, gas separators, cooling system')
            params.setdefault('OPERATING_CONDITIONS', 'ambient to 80°C, 1-30 bar pressure')
            params.setdefault('ADDITIONAL_SPECS', '')
        
        elif template_id == "process_flow_diagram":
            params.setdefault('PROCESS_NAME', params.get('OBJECT_NAME', 'industrial process'))
            params.setdefault('PROCESS_UNITS', 'reactors, separators, heat exchangers, pumps, compressors')
            params.setdefault('ADDITIONAL_SPECS', '')
        
        elif template_id == "technical_illustration":
            params.setdefault('ADDITIONAL_SPECS', '')
        
        return params
    
    def build_engineering_prompt(self, template_id: str, params: Dict) -> str:
        """Build final prompt from template and parameters"""
        if template_id not in self.master_prompts:
            return None
        
        template = self.master_prompts[template_id]["template"]
        
        # Replace all placeholders
        prompt = template
        for key, value in params.items():
            prompt = prompt.replace(f"{{{key}}}", str(value))
        
        # Clean up any remaining placeholders
        prompt = re.sub(r'\{[A-Z_]+\}', '', prompt)
        
        return prompt.strip()
        
    def detect_media_request(self, message: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Detect if user is requesting image or video generation
        Enhanced with Master Prompt Engineering for technical content
        
        Returns:
            Tuple of (media_type, prompt) where media_type is 'image', 'video', or None
        """
        message_lower = message.lower()
        
        # Image generation keywords
        image_keywords = [
            'buatkan gambar', 'buat gambar', 'generate image', 'create image',
            'gambarkan', 'visualisasi', 'ilustrasi', 'draw', 'sketch',
            'buat ilustrasi', 'generate illustration', 'tolong gambar',
            'buatkan ilustrasi', 'tampilkan gambar', 'buat visual',
            'desain gambar', 'design image', 'create visual', 'buat desain',
            'gambar tentang', 'ilustrasikan'
        ]
        
        # Video generation keywords
        video_keywords = [
            'buatkan video', 'buat video', 'generate video', 'create video',
            'animasi', 'animation', 'video tentang', 'rekam', 'buat animasi',
            'visualisasi video', 'video ilustrasi', 'make a video', 'make video',
            'video of', 'create a video'
        ]
        
        # Check for video first (more specific)
        for keyword in video_keywords:
            if keyword in message_lower:
                return ('video', message)
        
        # Check for image
        for keyword in image_keywords:
            if keyword in message_lower:
                # Check if this is an engineering request
                template_id, params = self.detect_engineering_context(message)
                
                if template_id:
                    # Build enhanced engineering prompt
                    enhanced_prompt = self.build_engineering_prompt(template_id, params)
                    print(f"[Engineering Prompt] Using template: {template_id}")
                    print(f"[Engineering Prompt] Enhanced prompt: {enhanced_prompt[:200]}...")
                    return ('image', enhanced_prompt)
                else:
                    return ('image', message)
        
        return (None, None)
    
    async def generate_image(self, prompt: str, model: str = 'huggingface') -> dict:
        """
        Generate image using Hugging Face (primary) or OpenAI DALL-E (fallback)
        
        Args:
            prompt: Text prompt for image generation
            model: Model to use:
                   - 'huggingface', 'sdxl', 'sd-2.1', 'flux' -> Hugging Face (FREE)
                   - 'dall-e-3', 'dall-e-2' -> OpenAI DALL-E (paid)
            
        Returns:
            dict with 'success', 'images' (list of base64 strings), 'error'
        """
        # Use Hugging Face for free models
        if model in ['huggingface', 'sdxl', 'sd-2.1', 'flux', 'default', 'hdi-image', 'hdi-image-flux']:
            return await self.generate_image_huggingface(prompt, model)
        
        # Use OpenAI DALL-E for paid models
        if model in ['dall-e-3', 'dall-e-2']:
            return await self.generate_image_openai(prompt, model)
        
        # Default to Hugging Face (free)
        return await self.generate_image_huggingface(prompt, model)
    
    async def generate_image_huggingface(self, prompt: str, model: str = 'sdxl') -> dict:
        """
        Generate image using Hugging Face Inference API (FREE)
        
        Args:
            prompt: Text prompt for image generation
            model: Model alias ('sdxl', 'sd-2.1', 'flux') or full model name
            
        Returns:
            dict with 'success', 'images' (list of base64 strings), 'error'
        """
        if not self.hf_client:
            return {
                'success': False,
                'images': [],
                'model': model,
                'error': 'Hugging Face client not available. Please set HUGGINGFACE_API_KEY in .env'
            }
        
        try:
            # Get full model name from alias
            model_name = HF_IMAGE_MODELS.get(model, HF_IMAGE_MODELS['default'])
            
            logger.info(f"Generating image with Hugging Face model: {model_name}")
            logger.info(f"Prompt: {prompt[:100]}...")
            
            # Generate image using Hugging Face
            image = self.hf_client.text_to_image(
                prompt=prompt,
                model=model_name
            )
            
            # Convert PIL Image to base64
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            image_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
            logger.info("Image generated successfully with Hugging Face")
            
            return {
                'success': True,
                'images': [image_base64],
                'model': model_name,
                'error': None
            }
            
        except Exception as e:
            logger.error(f"Hugging Face image generation error: {e}")
            return {
                'success': False,
                'images': [],
                'model': model,
                'error': str(e)
            }
    
    async def generate_image_openai(self, prompt: str, model: str = 'dall-e-3') -> dict:
        """
        Generate image using OpenAI DALL-E (paid)
        
        Args:
            prompt: Text prompt for image generation
            model: Model to use ('dall-e-3' or 'dall-e-2')
            
        Returns:
            dict with 'success', 'images' (list of base64 strings), 'error'
        """
        if not self.openai_client:
            return {
                'success': False,
                'images': [],
                'model': model,
                'error': 'OpenAI client not available. Please set OPENAI_API_KEY.'
            }
            
        try:
            response = await self.openai_client.images.generate(
                model=model,
                prompt=prompt,
                n=1,
                size="1024x1024",
                response_format="b64_json"
            )
            
            images_base64 = [img.b64_json for img in response.data]
            
            return {
                'success': True,
                'images': images_base64,
                'model': model,
                'error': None
            }
            
        except Exception as e:
            logger.error(f"OpenAI image generation error: {e}")
            return {
                'success': False,
                'images': [],
                'model': model,
                'error': str(e)
            }
    
    async def generate_video(self, prompt: str, model: str = 'hdi-video') -> dict:
        """
        Generate video using HuggingFace Inference API
        
        NOTE: As of Jan 2025, free Text-to-Video models are no longer available
        on the Hugging Face Serverless Inference API.
        
        Args:
            prompt: Text prompt for video generation
            model: Model alias or full model name
            
        Returns:
            dict with 'success', 'video_base64', 'error'
        """
        # Text-to-Video is not available on free Hugging Face Inference API
        # The models (ali-vilab, zeroscope, etc.) are no longer hosted serverlessly
        return {
            'success': False,
            'video_base64': None,
            'model': model,
            'error': """🚧 **Fitur Video Sedang Tidak Tersedia**

Hugging Face **tidak lagi menyediakan** layanan Text-to-Video gratis secara serverless (sejak awal 2026).

**Alternatif yang bisa dipertimbangkan:**
1. **Replicate.com** - Menyediakan API video generation (berbayar per penggunaan)
2. **Fal.ai** - API cepat untuk video generation
3. **Self-hosting** - Jalankan model seperti Zeroscope di GPU sendiri

*Untuk saat ini, silakan gunakan fitur **HDI Image** untuk visualisasi.*"""
        }
    
    def get_master_prompts(self) -> Dict:
        """Return all master prompt templates"""
        return self.master_prompts


# Singleton instance
media_service = MediaService()
