import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchService } from './searchService';
import { nvidiaRequestQueue } from './nvidiaRequestQueue';

export const SYSTEM_PROMPT = `Kamu adalah asisten AI untuk aplikasi ChatHDI.
Jawab dalam bahasa Indonesia yang jelas dan akurat kecuali pengguna meminta bahasa lain.
Gunakan context knowledge yang diberikan sistem jika relevan.
Jangan mengarang fakta, identitas, kontak, tautan, atau sumber yang tidak ada dalam context.
Jika informasi tidak tersedia, katakan dengan jujur bahwa informasi tersebut belum tersedia.
Gunakan Markdown, tabel, rumus, atau code block hanya jika membantu.
Saat menghasilkan aplikasi atau proyek multi-file, berikan proyek yang utuh dan dapat dijalankan:
- sertakan entry point, manifest dependensi, konfigurasi, komponen, dan stylesheet yang diperlukan;
- tulis path file sebagai heading tepat sebelum setiap code block, misalnya "### src/App.jsx";
- isi setiap code block harus berupa isi file lengkap, bukan potongan atau placeholder.`;

export const MODEL_MAPPING = {
  // === OLLAMA - Local/offline models ===
  "hdi-qwen3-local": ["ollama", "qwen3:1.7b", "Qwen3 1.7B - Local via Ollama"],

  // === NVIDIA API Catalog ===
  "hdi-nvidia-nemotron-nano": ["nvidia", "nvidia/nemotron-3-nano-30b-a3b", "Nemotron 3 Nano via NVIDIA"],
  "hdi-nvidia-nemotron-super": ["nvidia", "nvidia/nemotron-3-super-120b-a12b", "Nemotron 3 Super via NVIDIA"],
  "hdi-nvidia-nemotron-ultra": ["nvidia", "nvidia/nemotron-3-ultra-550b-a55b", "Nemotron 3 Ultra via NVIDIA"],
  "hdi-nvidia-llama-nano": ["nvidia", "nvidia/llama-3.1-nemotron-nano-8b-v1", "Llama Nemotron Nano via NVIDIA"],
  "hdi-nvidia-llama-super": ["nvidia", "nvidia/llama-3.3-nemotron-super-49b-v1.5", "Llama Nemotron Super via NVIDIA"],
  "hdi-nvidia-llama": ["nvidia", "meta/llama-3.3-70b-instruct", "Llama 3.3 70B via NVIDIA"],
  "hdi-nvidia-qwen": ["nvidia", "qwen/qwen3-next-80b-a3b-instruct", "Qwen3 Next Instruct via NVIDIA"],
  "hdi-nvidia-qwen-thinking": ["nvidia", "qwen/qwen3-next-80b-a3b-thinking", "Qwen3 Next Thinking via NVIDIA"],
  "hdi-nvidia-qwen-coder": ["nvidia", "qwen/qwen3-coder-480b-a35b-instruct", "Qwen3 Coder via NVIDIA"],
  "hdi-nvidia-kimi": ["nvidia", "moonshotai/kimi-k2-instruct", "Kimi K2 Instruct via NVIDIA"],
  "hdi-nvidia-gpt-oss": ["nvidia", "openai/gpt-oss-120b", "GPT-OSS 120B via NVIDIA"],
  "hdi-nvidia-phi": ["nvidia", "microsoft/phi-4-mini-instruct", "Phi-4 Mini via NVIDIA"],
  "hdi-nvidia-deepseek": ["nvidia", "deepseek-ai/deepseek-v4-flash", "DeepSeek V4 Flash via NVIDIA"],
  "hdi-nvidia-glm": ["nvidia", "z-ai/glm5.1", "GLM 5.1 via NVIDIA"],

  // === AIML API - Top Models (RECOMMENDED FREE) ===
  "hdi-gpt4o": ["aiml", "gpt-4o", "GPT-4o - OpenAI's best multimodal model"],
  "hdi-gpt4o-mini": ["aiml", "gpt-4o-mini", "GPT-4o Mini - Fast & efficient"],
  "hdi-claude": ["aiml", "claude-3-7-sonnet-latest", "Claude 3.7 Sonnet - Best for coding"],
  "hdi-claude-haiku": ["aiml", "claude-3-5-haiku-20241022", "Claude 3.5 Haiku - Fast & cheap"],
  "hdi-llama": ["aiml", "meta-llama/Llama-3.3-70B-Instruct-Turbo", "Llama 3.3 70B - Open source"],
  "hdi-gemma": ["aiml", "google/gemma-3-27b-it", "Gemma 3 27B - Google open source"],
  
  // === VERCEL AI GATEWAY (Requires Credit Card) ===
  "hdi-gemini": ["vercel", "google/gemini-2.0-flash-001", "Gemini 2.0 Flash via Vercel"],
  "hdi-gemini-search": ["vercel-grounding", "google/gemini-2.0-flash-001", "Gemini + Google Search"],
  
  // === DIRECT APIS - Free Fallbacks ===
  "hdi-4": ["gemini", "gemini-1.5-flash-latest", "Gemini 1.5 Flash (Direct, Free)"],
  "hdi-4-mini": ["gemini", "gemini-1.5-flash", "Gemini 1.5 Flash Mini"],
  "hdi-vision": ["gemini", "gemini-1.5-flash", "Gemini Vision"],
  "hdi-code": ["gemini", "gemini-1.5-flash", "Gemini for Code"],
  "hdi-video": ["gemini", "gemini-1.5-flash", "Gemini for Video"],
  
  // === GROQ - Ultra Fast Inference (Free) ===
  "hdi-grok": ["groq", "llama-3.3-70b-versatile", "Llama 3.3 70B via Groq"],
  "hdi-grok-mini": ["groq", "llama-3.1-8b-instant", "Llama 3.1 8B (instant)"],
  
  // === WEB SEARCH (Free, no API key) ===
  "hdi-search": ["web-search", "llama-3.3-70b-versatile", "Web Search + Llama 3.3"],
};

const getEnvKey = (key) => {
  const val = process.env[key] || '';
  if (!val || val.includes('your_') || val.includes('api_key_here') || val.length < 10) {
    return '';
  }
  return val;
};

export const getNvidiaOutputTokenBudget = (
  messages,
  modelName,
  configuredMaximum = 4096
) => {
  const hardMaximum = Number.isFinite(configuredMaximum)
    ? Math.max(256, configuredMaximum)
    : 4096;
  const lastUserMessage = [...messages]
    .reverse()
    .find(message => message.role === 'user' && typeof message.content === 'string')
    ?.content || '';
  const prompt = lastUserMessage.toLowerCase();
  const promptLength = lastUserMessage.length;

  const asksForCompactAnswer =
    /\b(ringkas|singkat|brief|kesimpulan saja|satu kalimat|jawab pendek)\b/i.test(prompt);
  const asksForDetailedAnswer =
    /\b(detail|lengkap|mendalam|analisis|laporan|dokumen|proposal|tutorial|langkah|tabel|spesifikasi|implementasi)\b/i.test(prompt);
  const asksForVeryDetailedAnswer =
    /\b(sangat detail|selengkap-lengkapnya|laporan lengkap|dokumen lengkap|analisis mendalam)\b/i.test(prompt);
  const asksForCode =
    /(```|\b(kode|coding|code|program|script|fungsi|class|api|sql)\b)/i.test(prompt);
  const asksForProject =
    /\b(website|web\s*app|aplikasi|project|proyek|frontend|react|next\.?js|vite|canvas)\b/i.test(
      prompt
    );
  const reasoningModel =
    /(thinking|coder|deepseek|gpt-oss|nemotron-3-(super|ultra))/i.test(modelName);

  let budget;
  if (asksForCompactAnswer) {
    budget = 384;
  } else if (promptLength <= 120) {
    budget = 512;
  } else if (promptLength <= 500) {
    budget = 768;
  } else if (promptLength <= 1500) {
    budget = 1024;
  } else if (promptLength <= 3500) {
    budget = 1536;
  } else {
    budget = 2048;
  }

  if (asksForDetailedAnswer) budget = Math.max(budget, 1536);
  if (asksForCode) budget = Math.max(budget, 2048);
  if (asksForProject) budget = Math.max(budget, 3072);
  if (reasoningModel) budget = Math.max(budget, 2048);
  if (asksForVeryDetailedAnswer || promptLength > 6000) {
    budget = Math.max(budget, 3072);
  }

  return Math.min(hardMaximum, budget);
};

class AIService {
  constructor() {
    this.googleApiKey = getEnvKey('GOOGLE_API_KEY') || getEnvKey('GEMINI_API_KEY');
    this.groqApiKey = getEnvKey('GROQ_API_KEY') || getEnvKey('GROK_API_KEY');
    this.vercelGatewayKey = getEnvKey('VERCEL_AI_GATEWAY_KEY');
    this.aimlApiKey = getEnvKey('AIML_API_KEY');
    this.nvidiaApiKey = getEnvKey('NVIDIA_API_KEY');
    this.nvidiaBaseUrl = (process.env.NVIDIA_API_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');
    this.nvidiaMaxTokens = Number.parseInt(process.env.NVIDIA_MAX_TOKENS || '4096', 10);
    this.ollamaBaseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
    this.ollamaContextLength = Number.parseInt(process.env.OLLAMA_CONTEXT_LENGTH || '2048', 10);

    this.aimlClient = this.aimlApiKey ? new OpenAI({
      apiKey: this.aimlApiKey,
      baseURL: "https://api.aimlapi.com/v1"
    }) : null;

    this.groqClient = this.groqApiKey ? new OpenAI({
      apiKey: this.groqApiKey,
      baseURL: "https://api.groq.com/openai/v1"
    }) : null;

    this.vercelClient = this.vercelGatewayKey ? new OpenAI({
      apiKey: this.vercelGatewayKey,
      baseURL: "https://ai-gateway.vercel.sh/v1"
    }) : null;

    this.nvidiaClient = this.nvidiaApiKey ? new OpenAI({
      apiKey: this.nvidiaApiKey,
      baseURL: this.nvidiaBaseUrl
    }) : null;

    this.geminiClient = this.googleApiKey ? new GoogleGenerativeAI(this.googleApiKey) : null;
  }

  async chat(messages, modelId = "hdi-gpt4o") {
    const modelInfo = MODEL_MAPPING[modelId] || ["aiml", "gpt-4o", "Default GPT-4o"];
    let provider = modelInfo[0];
    let modelName = modelInfo[1];

    console.log(`[AIService] Chat request: modelId=${modelId}, provider=${provider}, model=${modelName}`);

    // Smart fallback logic
    if (provider === "aiml" && !this.aimlClient) {
      if (this.groqClient) {
        console.warn(`[AIService] AIML not configured, falling back to Groq for ${modelId}`);
        provider = "groq";
        modelName = "llama-3.3-70b-versatile";
      } else if (this.googleApiKey) {
        console.warn(`[AIService] AIML not configured, falling back to Gemini for ${modelId}`);
        provider = "gemini";
        modelName = "gemini-1.5-flash";
      }
    }

    if ((provider === "vercel" || provider === "vercel-grounding") && !this.vercelClient) {
      if (this.aimlClient) {
        console.warn(`[AIService] Vercel not configured, falling back to AIML for ${modelId}`);
        provider = "aiml";
        modelName = "gpt-4o";
      } else if (this.googleApiKey) {
        console.warn(`[AIService] Vercel not configured, falling back to Gemini for ${modelId}`);
        provider = "gemini";
        modelName = "gemini-1.5-flash";
      }
    }

    // Route to appropriate provider
    if (provider === "ollama") {
      return await this._chatOllama(messages, modelName);
    } else if (provider === "nvidia") {
      return await this._chatNvidia(messages, modelName);
    } else if (provider === "aiml") {
      return await this._chatAiml(messages, modelName);
    } else if (provider === "vercel") {
      return await this._chatVercel(messages, modelName);
    } else if (provider === "vercel-grounding") {
      return await this._chatVercelWithGrounding(messages, modelName);
    } else if (provider === "groq") {
      return await this._chatGroq(messages, modelName);
    } else if (provider === "web-search") {
      return await this._chatWithSearch(messages, modelName);
    } else {
      return await this._chatGemini(messages, modelName);
    }
  }

  async _chatNvidia(messages, modelName) {
    if (!this.nvidiaClient) {
      throw new Error('NVIDIA_API_KEY belum dikonfigurasi di file .env server.');
    }

    const systemContext = messages
      .filter(message => message.role === 'system' && typeof message.content === 'string')
      .map(message => message.content.trim())
      .filter(Boolean);
    const conversation = messages.filter(message =>
      (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string'
    );
    const formattedMessages = [
      {
        role: 'system',
        content: [SYSTEM_PROMPT, ...systemContext].join('\n\n'),
      },
      ...conversation,
    ];

    try {
      const maxTokens = getNvidiaOutputTokenBudget(
        formattedMessages,
        modelName,
        this.nvidiaMaxTokens
      );
      console.log(`[AIService] NVIDIA output budget: ${maxTokens} tokens (${modelName})`);

      const response = await nvidiaRequestQueue.enqueue(
        () => this.nvidiaClient.chat.completions.create({
          model: modelName,
          messages: formattedMessages,
          max_tokens: maxTokens,
        }),
        { type: 'chat', model: modelName }
      );
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('NVIDIA tidak mengembalikan teks jawaban.');
      }
      return content;
    } catch (error) {
      console.error(`[AIService] NVIDIA Error (${modelName}):`, error.message);
      const status = error.status ? ` (HTTP ${error.status})` : '';
      throw new Error(`Permintaan NVIDIA untuk model ${modelName} gagal${status}: ${error.message}`);
    }
  }

  async _chatOllama(messages, modelName) {
    let lastError;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
            stream: false,
            think: false,
            options: {
              num_ctx: Number.isFinite(this.ollamaContextLength) ? this.ollamaContextLength : 2048,
            },
          }),
        });

        if (!response.ok) {
          const details = await response.text();
          const requestError = new Error(details || `HTTP ${response.status}`);
          requestError.status = response.status;
          throw requestError;
        }

        const data = await response.json();
        if (!data.message?.content) {
          throw new Error('Ollama tidak mengembalikan teks jawaban.');
        }

        return data.message.content;
      } catch (error) {
        lastError = error;
        const canRetry = attempt === 1 && (!error.status || error.status >= 500);
        if (canRetry) {
          await new Promise(resolve => setTimeout(resolve, 750));
          continue;
        }
        break;
      }
    }

    console.error('[AIService] Ollama Error:', lastError?.message);
    throw new Error(
      `Ollama lokal tidak dapat diakses. Pastikan aplikasi Ollama aktif dan model ${modelName} sudah terpasang. Detail: ${lastError?.message || 'koneksi gagal'}`
    );
  }

  async _chatAiml(messages, modelName) {
    if (!this.aimlClient) {
      return `❌ **AIML API tidak dikonfigurasi**

Untuk menggunakan GPT-4o, Claude 3.5, Llama, dan 400+ model:
1. Daftar gratis di https://aimlapi.com
2. Buat API Key di Dashboard
3. Tambahkan ke backend/.env: \`AIML_API_KEY=your_key\`

**Gratis 50,000 credits tanpa kartu kredit!**`;
    }

    try {
      const formattedMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
      const response = await this.aimlClient.chat.completions.create({
        model: modelName,
        messages: formattedMessages
      });
      return response.choices[0].message.content;
    } catch (e) {
      console.error("[AIService] AIML API Error:", e.message);
      return `❌ **Error dari AIML API:**\n\n\`\`\`\n${e.message}\n\`\`\`\n\n**Solusi:**\n1. Cek API Key di https://aimlapi.com/dashboard\n2. Pastikan model \`${modelName}\` tersedia di akun Anda`;
    }
  }

  async _chatVercel(messages, modelName) {
    if (!this.vercelClient) {
      return `❌ **Vercel AI Gateway tidak dikonfigurasi**

Model ini memerlukan Vercel AI Gateway yang **membutuhkan verifikasi kartu kredit**.

**Alternatif GRATIS:**
- Pilih **Gemini 1.5 Flash** (HDI-4) dari dropdown
- Pilih **Llama 3.3 70B** (HDI-Grok) dari dropdown`;
    }

    try {
      const formattedMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
      const response = await this.vercelClient.chat.completions.create({
        model: modelName,
        messages: formattedMessages
      });
      return response.choices[0].message.content;
    } catch (e) {
      console.error("[AIService] Vercel AI Gateway Error:", e.message);
      return `❌ **Error dari Vercel AI Gateway:**\n\n\`\`\`\n${e.message}\n\`\`\``;
    }
  }

  async _chatVercelWithGrounding(messages, modelName) {
    if (!this.vercelClient) {
      return "❌ Error: VERCEL_AI_GATEWAY_KEY tidak dikonfigurasi.";
    }
    try {
      const lastUserMsg = messages[messages.length - 1]?.content || '';
      const groundingPrompt = `${SYSTEM_PROMPT}\n\n**PENTING - Mode Google Search Grounding Aktif:**\n- Berikan informasi yang up-to-date dan faktual dari internet\n- Sertakan sumber atau referensi jika memungkinkan.`;
      
      const formattedMessages = [{ role: "system", content: groundingPrompt }, ...messages];
      const response = await this.vercelClient.chat.completions.create({
        model: modelName,
        messages: formattedMessages
      });

      let result = response.choices[0].message.content;
      if (result && !result.startsWith("🔍")) {
        result = `🔍 *Hasil dengan Google Search:*\n\n${result}`;
      }
      return result;
    } catch (e) {
      console.error("[AIService] Vercel Grounding Error:", e.message);
      return await this._chatVercel(messages, modelName);
    }
  }

  async _chatGroq(messages, modelName) {
    if (!this.groqClient) {
      return "❌ Error: GROQ_API_KEY tidak dikonfigurasi. Tambahkan ke .env";
    }
    try {
      const formattedMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
      const response = await this.groqClient.chat.completions.create({
        model: modelName,
        messages: formattedMessages
      });
      return response.choices[0].message.content;
    } catch (e) {
      console.error("[AIService] Groq Error:", e.message);
      return `❌ Error dari Groq: ${e.message}`;
    }
  }

  async _chatWithSearch(messages, modelName) {
    if (!this.groqClient) {
      return "❌ Error: GROQ_API_KEY tidak dikonfigurasi. Web Search memerlukan LLM untuk memproses hasil.";
    }

    try {
      const lastUserMsg = messages[messages.length - 1]?.content || '';
      if (!lastUserMsg) {
        return "❌ Error: Tidak ada pesan user untuk dicari.";
      }

      const searchResults = await searchService.search(lastUserMsg, 5);
      if (!searchResults || searchResults.length === 0) {
        return `🔍 **Web Search tidak menemukan hasil untuk: "${lastUserMsg}"**\n\nCoba cari dengan kata kunci lain.`;
      }

      const searchContext = searchService.formatResultsForAI(searchResults, lastUserMsg);
      const searchPrompt = `${SYSTEM_PROMPT}\n\n**MODE WEB SEARCH AKTIF**\n\n${searchContext}\n\nJawablah dengan lengkap berdasarkan hasil pencarian di atas.`;

      const formattedMessages = [{ role: "system", content: searchPrompt }, ...messages];
      const response = await this.groqClient.chat.completions.create({
        model: modelName,
        messages: formattedMessages
      });

      let result = response.choices[0].message.content;
      
      // Build sources section
      let sourcesSection = "\n\n---\n\n📚 **Sumber:**\n";
      searchResults.forEach((sr, idx) => {
        sourcesSection += `${idx + 1}. [${sr.title.substring(0, 60)}](${sr.link})\n`;
      });

      if (!result.startsWith("🔍")) {
        result = `🔍 **Hasil dengan Web Search:**\n\n${result}`;
      }
      result += sourcesSection;
      
      return result;
    } catch (e) {
      console.error("[AIService] Web Search Error:", e.message);
      return await this._chatGroq(messages, modelName);
    }
  }

  async _chatGemini(messages, modelName) {
    if (!this.geminiClient) {
      return "❌ Error: GOOGLE_API_KEY tidak dikonfigurasi. Tambahkan ke .env";
    }

    try {
      const systemContext = messages
        .filter(message => message.role === 'system' && typeof message.content === 'string')
        .map(message => message.content.trim())
        .filter(Boolean);

      // Direct Gemini client call
      const model = this.geminiClient.getGenerativeModel({
        model: modelName,
        systemInstruction: [SYSTEM_PROMPT, ...systemContext].join('\n\n')
      });

      // Format messages history for Gemini: {role: "user" | "model", parts: [{text: "..."}]}
      const history = [];
      const lastMessage = messages[messages.length - 1]?.content || '';

      for (let i = 0; i < messages.length - 1; i++) {
        const msg = messages[i];
        if (msg.role === 'system') continue;
        history.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }

      const chatSession = model.startChat({ history });
      const result = await chatSession.sendMessage(lastMessage);
      return result.response.text();
    } catch (e) {
      console.error("[AIService] Gemini Error:", e.message);
      if (e.message.includes("429")) {
        return "⏳ Kuota API Gemini sedang penuh. Silakan coba lagi nanti atau gunakan model lain.";
      }
      return `❌ Error dari Gemini: ${e.message}`;
    }
  }
}

export const aiService = new AIService();
