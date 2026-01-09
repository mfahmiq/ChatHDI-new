"""
AI Service for ChatHDI - Google Gemini & Groq Integration
Supports: 
- Google Gemini (gemini-1.5-flash, gemini-1.5-pro)
- Groq (llama-3.3-70b, mixtral-8x7b) - Fast inference
"""

import os
import logging
import google.generativeai as genai
from openai import AsyncOpenAI
from typing import List, Dict

logger = logging.getLogger(__name__)

# Get API Keys
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '') or os.environ.get('GROK_API_KEY', '')

# Helper to check if keys are placeholders
def is_valid_key(key):
    return key and 'your_' not in key and 'api_key_here' not in key

# Configure Gemini
if not is_valid_key(GOOGLE_API_KEY):
    logger.warning("GOOGLE_API_KEY not set - Gemini features will not work")
else:
    genai.configure(api_key=GOOGLE_API_KEY)

# Configure Groq (OpenAI Compatible - fast inference)
groq_client = None
if not is_valid_key(GROQ_API_KEY):
    logger.warning("GROQ_API_KEY not set - Groq features will not work")
else:
    groq_client = AsyncOpenAI(
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
    )


# System prompt for ChatHDI
SYSTEM_PROMPT = """Kamu adalah ChatHDI, asisten AI canggih yang dikembangkan oleh HDI (Hydrogen Development Indonesia) untuk membantu riset dan pengembangan di bidang:

1. **Teknologi Hidrogen**:
   - Produksi: Elektrolisis (Alkaline, PEM, SOEC), Steam Methane Reforming, Plasmalysis
   - Penyimpanan: Metal Hydrides, Compressed Gas, Liquid H2, LOHC
   - Aplikasi: Fuel Cells (PEMFC, SOFC), Combustion, Ammonia

2. **Energi Terbarukan**:
   - Solar PV & Thermal
   - Wind (Onshore & Offshore)
   - Geothermal
   - Biomass & Biogas
   - Hydro

3. **R&D Engineering**:
   - Material Science (Catalysts, Membranes)
   - Electrochemistry
   - Process Engineering
   - Techno-economic Analysis

4. **Coding Assistant**:
   - Python (FastAPI, Pandas, NumPy)
   - React (TailwindCSS, Hooks)
   - Data Analysis & Visualization

**Gaya Komunikasi:**
- Gunakan bahasa Indonesia yang baik dan benar
- Jelaskan konsep teknis dengan cara yang mudah dipahami
- Berikan data dan fakta yang akurat
- Sertakan persamaan/rumus jika relevan
- Format menggunakan Markdown untuk readability

**Penting:**
- Jika ditanya tentang topik di luar keahlian, tetap jawab dengan baik
- Selalu berikan referensi atau sumber jika memungkinkan
- Gunakan tabel untuk perbandingan data
- Gunakan code blocks untuk rumus atau kode"""


# Model mapping: internal model ID -> (Provider, Model Name)
MODEL_MAPPING = {
    "hdi-4": ("gemini", "gemini-1.5-flash"),        # Default standard
    "hdi-4-mini": ("gemini", "gemini-1.5-flash"),   # Default fast
    "hdi-vision": ("gemini", "gemini-1.5-pro"),     # Default capable
    "hdi-code": ("gemini", "gemini-1.5-flash"),     # Default code
    
    # Groq Models (Fast inference)
    "hdi-grok": ("groq", "llama-3.3-70b-versatile"),   # Llama 3.3 70B
    "hdi-grok-mini": ("groq", "llama-3.1-8b-instant"), # Llama 3.1 8B (fast)
}


class AIService:
    """Multi-provider AI service (Gemini + Groq)"""
    
    def __init__(self):
        pass
    
    async def chat(self, messages: List[Dict], model_id: str = "hdi-4") -> str:
        """Route chat request to appropriate provider"""
        
        # Determine provider and model name
        provider, model_name = MODEL_MAPPING.get(model_id, ("gemini", "gemini-1.5-flash"))
        
        if provider == "groq":
            return await self._chat_groq(messages, model_name)
        else:
            return await self._chat_gemini(messages, model_name)

    async def _chat_groq(self, messages: List[Dict], model_name: str) -> str:
        """Handle chat with Groq (via OpenAI SDK)"""
        if not groq_client:
            return "Error: GROQ_API_KEY not configured. Please add your key to backend/.env"
            
        try:
            # Prepare messages with system prompt
            formatted_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            formatted_messages.extend(messages)
            
            response = await groq_client.chat.completions.create(
                model=model_name,
                messages=formatted_messages,
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Groq Error: {e}")
            return f"Maaf, terjadi kesalahan dengan Groq. Error: {str(e)}"

    async def _chat_gemini(self, messages: List[Dict], model_name: str) -> str:
        """Handle chat with Google Gemini"""
        if not is_valid_key(GOOGLE_API_KEY):
             return "Error: GOOGLE_API_KEY not set or invalid. Please check backend/.env"

        try:
            # Initialize model
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=SYSTEM_PROMPT
            )
            
            # Convert messages to Gemini format
            history = []
            last_user_message = ""
            
            for msg in messages:
                role = msg["role"]
                content = msg["content"]
                
                if role == "system":
                    continue # System prompt passed separately
                
                if role == "assistant":
                    role = "model"
                
                # Check for last message (which is the prompt)
                if msg == messages[-1] and role == "user":
                    last_user_message = content
                else:
                    history.append({"role": role, "parts": [content]})
            
            # Create chat session
            chat_session = model.start_chat(history=history)
            
            # Send message
            response = await chat_session.send_message_async(last_user_message)
            
            return response.text
                
        except Exception as e:
            logger.error(f"Gemini Error: {e}")
            # Handle potential quota error gracefully
            if "429" in str(e):
                return "Maaf, kuota API Gemini (Google) sedang penuh. Silakan coba lagi nanti atau gunakan model lain."
            return f"Maaf, terjadi kesalahan saat memproses permintaan Anda dengan Gemini. Error: {str(e)}"


# Singleton instance
ai_service = AIService()
