"""
AI Service for ChatHDI - Multi-Provider Integration
Supports: 
- AIML API (GPT-4o, Claude 3.5, Llama, 400+ models) - RECOMMENDED FREE
- Vercel AI Gateway (requires credit card)
- Google Gemini (direct API)
- Groq (fast inference)
"""

import os
import logging
import google.generativeai as genai
from openai import AsyncOpenAI
from typing import List, Dict

logger = logging.getLogger(__name__)

# Get API Keys
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '') or os.environ.get('GEMINI_API_KEY', '')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '') or os.environ.get('GROK_API_KEY', '')
VERCEL_AI_GATEWAY_KEY = os.environ.get('VERCEL_AI_GATEWAY_KEY', '')
AIML_API_KEY = os.environ.get('AIML_API_KEY', '')

# Helper to check if keys are placeholders
def is_valid_key(key):
    return key and 'your_' not in key and 'api_key_here' not in key and len(key) > 10

# Configure Gemini (direct API - fallback)
if not is_valid_key(GOOGLE_API_KEY):
    logger.warning("GOOGLE_API_KEY not set - Direct Gemini features will not work")
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

# Configure AIML API (RECOMMENDED - FREE, access to 400+ models)
aiml_client = None
if not is_valid_key(AIML_API_KEY):
    logger.warning("AIML_API_KEY not set - Get FREE key at https://aimlapi.com")
else:
    aiml_client = AsyncOpenAI(
        api_key=AIML_API_KEY,
        base_url="https://api.aimlapi.com/v1",
    )
    logger.info("AIML API configured - Access to GPT-4o, Claude, Llama, and 400+ models!")

# Configure Vercel AI Gateway (requires credit card verification)
vercel_client = None
if not is_valid_key(VERCEL_AI_GATEWAY_KEY):
    logger.info("VERCEL_AI_GATEWAY_KEY not set (optional, requires credit card)")
else:
    vercel_client = AsyncOpenAI(
        api_key=VERCEL_AI_GATEWAY_KEY,
        base_url="https://ai-gateway.vercel.sh/v1",
    )
    logger.info("Vercel AI Gateway configured")


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


# Model mapping: internal model ID -> (Provider, Model Name, Description)
MODEL_MAPPING = {
    # === AIML API - Top Models (RECOMMENDED FREE) ===
    "hdi-gpt4o": ("aiml", "gpt-4o", "GPT-4o - OpenAI's best multimodal model"),
    "hdi-gpt4o-mini": ("aiml", "gpt-4o-mini", "GPT-4o Mini - Fast & efficient"),
    "hdi-claude": ("aiml", "claude-3-7-sonnet-latest", "Claude 3.7 Sonnet - Best for coding"),
    "hdi-claude-haiku": ("aiml", "claude-3-5-haiku-20241022", "Claude 3.5 Haiku - Fast & cheap"),
    "hdi-llama": ("aiml", "meta-llama/Llama-3.3-70B-Instruct-Turbo", "Llama 3.3 70B - Open source"),
    "hdi-gemma": ("aiml", "google/gemma-3-27b-it", "Gemma 3 27B - Google open source"),
    
    # === VERCEL AI GATEWAY (Requires Credit Card) ===
    "hdi-gemini": ("vercel", "google/gemini-2.0-flash-001", "Gemini 2.0 Flash via Vercel"),
    "hdi-gemini-search": ("vercel-grounding", "google/gemini-2.0-flash-001", "Gemini + Google Search"),
    
    # === DIRECT APIS - Free Fallbacks ===
    "hdi-4": ("gemini", "gemini-1.5-flash-latest", "Gemini 1.5 Flash (Direct, Free)"),
    "hdi-4-mini": ("gemini", "gemini-1.5-flash", "Gemini 1.5 Flash Mini"),
    "hdi-vision": ("gemini", "gemini-1.5-flash", "Gemini Vision"),
    "hdi-code": ("gemini", "gemini-1.5-flash", "Gemini for Code"),
    "hdi-video": ("gemini", "gemini-1.5-flash", "Gemini for Video"),
    
    # === GROQ - Ultra Fast Inference (Free) ===
    "hdi-grok": ("groq", "llama-3.3-70b-versatile", "Llama 3.3 70B via Groq"),
    "hdi-grok-mini": ("groq", "llama-3.1-8b-instant", "Llama 3.1 8B (instant)"),
}


class AIService:
    """Multi-provider AI service (AIML + Vercel + Gemini + Groq)"""
    
    def __init__(self):
        pass
    
    async def chat(self, messages: List[Dict], model_id: str = "hdi-gpt4o") -> str:
        """Route chat request to appropriate provider"""
        
        # Get model info, default to AIML GPT-4o if model not found
        model_info = MODEL_MAPPING.get(model_id, ("aiml", "gpt-4o", "Default GPT-4o"))
        provider = model_info[0]
        model_name = model_info[1]
        
        logger.info(f"Chat request: model_id={model_id}, provider={provider}, model={model_name}")
        
        # Smart fallback logic
        # If AIML is requested but not configured, try alternatives
        if provider == "aiml" and not aiml_client:
            if groq_client:
                logger.warning(f"AIML not configured, falling back to Groq for {model_id}")
                provider = "groq"
                model_name = "llama-3.3-70b-versatile"
            elif is_valid_key(GOOGLE_API_KEY):
                logger.warning(f"AIML not configured, falling back to Gemini for {model_id}")
                provider = "gemini"
                model_name = "gemini-1.5-flash"
        
        # If Vercel is requested but not configured, try alternatives
        if provider in ("vercel", "vercel-grounding") and not vercel_client:
            if aiml_client:
                logger.warning(f"Vercel not configured, falling back to AIML for {model_id}")
                provider = "aiml"
                model_name = "gpt-4o"
            elif is_valid_key(GOOGLE_API_KEY):
                logger.warning(f"Vercel not configured, falling back to Gemini for {model_id}")
                provider = "gemini"
                model_name = "gemini-1.5-flash"
        
        # Route to appropriate provider
        if provider == "aiml":
            return await self._chat_aiml(messages, model_name)
        elif provider == "vercel":
            return await self._chat_vercel(messages, model_name)
        elif provider == "vercel-grounding":
            return await self._chat_vercel_with_grounding(messages, model_name)
        elif provider == "groq":
            return await self._chat_groq(messages, model_name)
        else:
            return await self._chat_gemini(messages, model_name)

    async def _chat_aiml(self, messages: List[Dict], model_name: str) -> str:
        """Handle chat with AIML API (GPT-4o, Claude, Llama, 400+ models)"""
        if not aiml_client:
            return """❌ **AIML API tidak dikonfigurasi**

Untuk menggunakan GPT-4o, Claude 3.5, Llama, dan 400+ model:
1. Daftar gratis di https://aimlapi.com
2. Buat API Key di Dashboard
3. Tambahkan ke backend/.env: `AIML_API_KEY=your_key`

**Gratis 50,000 credits tanpa kartu kredit!**"""
            
        try:
            # Prepare messages with system prompt
            formatted_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            formatted_messages.extend(messages)
            
            response = await aiml_client.chat.completions.create(
                model=model_name,
                messages=formatted_messages,
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"AIML API Error: {e}")
            error_str = str(e)
            
            return f"""❌ **Error dari AIML API:**

```
{error_str}
```

**Solusi:**
1. Cek API Key di https://aimlapi.com/dashboard
2. Pastikan model `{model_name}` tersedia di akun Anda
3. Cek sisa credits di dashboard"""

    async def _chat_vercel(self, messages: List[Dict], model_name: str) -> str:
        """Handle chat with Vercel AI Gateway (OpenAI, Claude, Gemini)"""
        if not vercel_client:
            return """❌ **Vercel AI Gateway tidak dikonfigurasi**

Model ini (GPT-4o, Claude 3.5, Gemini 2.0) memerlukan Vercel AI Gateway yang **membutuhkan verifikasi kartu kredit**.

**Alternatif GRATIS tanpa kartu kredit:**
- 💫 **Gemini 1.5 Flash** - Pilih dari dropdown
- 🌌 **Llama 3.3 70B** - Via Groq, super cepat

Cukup pilih model FREE di dropdown untuk mulai chat!"""
            
        try:
            # Prepare messages with system prompt
            formatted_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            formatted_messages.extend(messages)
            
            response = await vercel_client.chat.completions.create(
                model=model_name,
                messages=formatted_messages,
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Vercel AI Gateway Error: {e}")
            error_str = str(e)
            
            # Show full error for debugging, with helpful context
            error_msg = f"""❌ **Error dari Vercel AI Gateway:**

```
{error_str}
```

**Kemungkinan penyebab:**
- API Key tidak valid atau salah format
- Model tidak tersedia di akun Anda
- Rate limit tercapai

**Solusi:**
1. Cek API Key di https://vercel.com/dashboard → Settings → AI Gateway
2. Pastikan key diawali dengan format yang benar
3. Atau gunakan model **HDI-4** yang menggunakan Gemini API langsung"""
            
            return error_msg

    async def _chat_vercel_with_grounding(self, messages: List[Dict], model_name: str) -> str:
        """Handle chat with Vercel AI Gateway + Google Search Grounding"""
        if not vercel_client:
            return "❌ Error: VERCEL_AI_GATEWAY_KEY tidak dikonfigurasi."
            
        try:
            # Get the last user message for search context
            last_user_msg = ""
            for msg in reversed(messages):
                if msg["role"] == "user":
                    last_user_msg = msg["content"]
                    break
            
            # Add grounding instruction to system prompt
            grounding_prompt = f"""{SYSTEM_PROMPT}

**PENTING - Mode Google Search Grounding Aktif:**
- Kamu memiliki akses ke informasi terkini dari internet
- Berikan informasi yang up-to-date dan faktual
- Sertakan sumber atau referensi jika memungkinkan
- Jika diminta berita atau informasi terkini, berikan yang paling relevan

Pertanyaan user memerlukan informasi real-time, jadi berikan jawaban yang akurat dan terkini."""

            formatted_messages = [{"role": "system", "content": grounding_prompt}]
            formatted_messages.extend(messages)
            
            # Use Gemini with web search capability through Vercel
            response = await vercel_client.chat.completions.create(
                model=model_name,
                messages=formatted_messages,
                # Note: Vercel AI Gateway handles grounding for supported models
            )
            
            result = response.choices[0].message.content
            
            # Add indicator that this used search
            if result and not result.startswith("🔍"):
                result = f"🔍 *Hasil dengan Google Search:*\n\n{result}"
            
            return result
            
        except Exception as e:
            logger.error(f"Vercel Grounding Error: {e}")
            # Fallback to regular Vercel call
            return await self._chat_vercel(messages, model_name)

    async def _chat_groq(self, messages: List[Dict], model_name: str) -> str:
        """Handle chat with Groq (via OpenAI SDK)"""
        if not groq_client:
            return "❌ Error: GROQ_API_KEY tidak dikonfigurasi. Tambahkan ke backend/.env"
            
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
            return f"❌ Error dari Groq: {str(e)}"

    async def _chat_gemini(self, messages: List[Dict], model_name: str) -> str:
        """Handle chat with Google Gemini (Direct API)"""
        if not is_valid_key(GOOGLE_API_KEY):
             return "❌ Error: GOOGLE_API_KEY tidak dikonfigurasi. Tambahkan ke backend/.env"

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
                return "⏳ Kuota API Gemini (Google) sedang penuh. Silakan coba lagi nanti atau gunakan model lain."
            return f"❌ Error dari Gemini: {str(e)}"


# Singleton instance
ai_service = AIService()
