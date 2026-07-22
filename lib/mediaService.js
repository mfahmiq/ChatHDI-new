import OpenAI from 'openai';
import axios from 'axios';

const HF_IMAGE_MODELS = {
  "sdxl": "stabilityai/stable-diffusion-xl-base-1.0",
  "sd-2.1": "stabilityai/stable-diffusion-2-1", 
  "flux": "black-forest-labs/FLUX.1-schnell",
  "default": "stabilityai/stable-diffusion-xl-base-1.0",
  "hdi-image": "stabilityai/stable-diffusion-xl-base-1.0",
  "hdi-image-flux": "black-forest-labs/FLUX.1-schnell"
};

export const MASTER_PROMPTS = {
  "engineering_cad": {
    "id": "engineering_cad",
    "name": "Engineering CAD Visualization",
    "description": "High-quality industrial CAD rendering untuk komponen teknik",
    "template": `High-detail industrial CAD rendering of {OBJECT_NAME}, designed for {TECHNICAL_FUNCTION}, following mechanical engineering standards.

The model is created in professional CAD style (SolidWorks / AutoCAD / Fusion 360 / CATIA), with precise dimensions, correct tolerances, and realistic mechanical assembly.

Features include accurate geometry, sharp edges, chamfers, fillets, bolt holes, threads, bearings, and mounting points, fully aligned and manufacturable.

Rendered in industrial environment, neutral background, engineering visualization, no artistic distortion.

Materials are physically accurate: {MATERIALS}.

Lighting is technical and uniform, emphasizing edges, depth, and part separation.

Style is technical documentation quality, clean, professional, realistic, suitable for manufacturing and engineering review.

{ADDITIONAL_SPECS}`,
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
    "template": `High-detail industrial visualization of {OBJECT_NAME}, a hydrogen {EQUIPMENT_TYPE} system designed for {TECHNICAL_FUNCTION}.

Professional engineering rendering showing:
- Main components: {MAIN_COMPONENTS}
- Operating conditions: {OPERATING_CONDITIONS}
- Safety features: pressure relief valves, leak detection, ventilation systems

CAD-quality visualization with accurate proportions, proper material representation, and industrial standard compliance.

Materials: stainless steel 316L for hydrogen contact surfaces, carbon steel for structural elements, specialized seals and gaskets for hydrogen service.

Clean industrial background, technical lighting, engineering documentation quality.

{ADDITIONAL_SPECS}`,
    "keywords": ["hidrogen", "hydrogen", "elektrolisis", "electrolysis", "pem", "soec", "alkaline",
                "storage", "penyimpanan", "fuel cell", "h2", "green hydrogen", "blue hydrogen"]
  },
  
  "process_flow_diagram": {
    "id": "process_flow_diagram",
    "name": "Process Flow Diagram",
    "description": "Diagram alir proses industri",
    "template": `Professional Process Flow Diagram (PFD) for {PROCESS_NAME}.

Clear engineering diagram showing:
- Process units: {PROCESS_UNITS}
- Flow directions with arrows
- Major equipment symbols (ISO/ANSI standards)
- Stream labels and flow rates
- Operating parameters

Style: Technical P&ID/PFD standard, clean lines, proper symbols, readable labels.
Color coding: Process streams in blue, utilities in green, products in yellow.
Background: White/light gray engineering paper style.

{ADDITIONAL_SPECS}`,
    "keywords": ["diagram alir", "flow diagram", "pfd", "p&id", "proses", "process flow", 
                "alur", "flowchart teknik", "diagram proses"]
  },
  
  "technical_illustration": {
    "id": "technical_illustration",
    "name": "Technical Illustration",
    "description": "Ilustrasi teknis untuk dokumentasi",
    "template": `Professional technical illustration of {OBJECT_NAME} for engineering documentation.

Detailed cutaway/exploded view showing:
- Internal components and assembly
- Part numbering and callouts
- Dimensional annotations
- Material specifications

Style: Technical manual quality, isometric or orthographic projection.
Clean lines, precise geometry, professional appearance.
Suitable for manufacturing documentation and training materials.

{ADDITIONAL_SPECS}`,
    "keywords": ["ilustrasi teknis", "technical drawing", "gambar teknik", "cutaway", 
                "exploded view", "assembly drawing", "detail drawing"]
  }
};

class MediaService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || process.env.EMERGENT_LLM_KEY || '';
    this.hfApiKey = process.env.HUGGINGFACE_API_KEY || '';
    
    this.openaiClient = this.openaiApiKey ? new OpenAI({ apiKey: this.openaiApiKey }) : null;
  }

  detectMediaRequest(message) {
    // Media detection matching python version (disabled by default in chat)
    return [null, null];
  }

  async generateImage(prompt, model = 'huggingface') {
    if (['huggingface', 'sdxl', 'sd-2.1', 'flux', 'default', 'hdi-image', 'hdi-image-flux'].includes(model)) {
      return await this.generateImageHuggingface(prompt, model);
    }
    if (['dall-e-3', 'dall-e-2'].includes(model)) {
      return await this.generateImageOpenai(prompt, model);
    }
    return await this.generateImageHuggingface(prompt, model);
  }

  async generateImageHuggingface(prompt, model = 'sdxl') {
    if (!this.hfApiKey) {
      return {
        success: false,
        images: [],
        model: model,
        error: 'Hugging Face API key not configured. Please set HUGGINGFACE_API_KEY in .env'
      };
    }

    try {
      const modelName = HF_IMAGE_MODELS[model] || HF_IMAGE_MODELS['default'];
      console.log(`[MediaService] Generating image via HF model: ${modelName}`);

      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${modelName}`,
        { inputs: prompt },
        {
          headers: {
            'Authorization': `Bearer ${this.hfApiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      console.log('[MediaService] Image generated successfully via HF');

      return {
        success: true,
        images: [base64Image],
        model: modelName,
        error: null
      };
    } catch (e) {
      console.error('[MediaService] HF Image gen error:', e.message);
      return {
        success: false,
        images: [],
        model: model,
        error: e.response ? Buffer.from(e.response.data).toString('utf-8') : e.message
      };
    }
  }

  async generateImageOpenai(prompt, model = 'dall-e-3') {
    if (!this.openaiClient) {
      return {
        success: false,
        images: [],
        model: model,
        error: 'OpenAI client not available. Please set OPENAI_API_KEY.'
      };
    }

    try {
      console.log(`[MediaService] Generating image via OpenAI model: ${model}`);
      const response = await this.openaiClient.images.generate({
        model: model,
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      });

      const images = response.data.map(img => img.b64_json);
      return {
        success: true,
        images: images,
        model: model,
        error: null
      };
    } catch (e) {
      console.error('[MediaService] OpenAI Image gen error:', e.message);
      return {
        success: false,
        images: [],
        model: model,
        error: e.message
      };
    }
  }

  async generateVideo(prompt, model = 'hdi-video') {
    return {
      success: false,
      video_base64: null,
      model: model,
      error: `🚧 **Fitur Video Sedang Tidak Tersedia**

Hugging Face **tidak lagi menyediakan** layanan Text-to-Video gratis secara serverless.

*Untuk saat ini, silakan gunakan fitur **HDI Image** untuk visualisasi.*`
    };
  }

  getMasterPrompts() {
    return MASTER_PROMPTS;
  }
}

export const mediaService = new MediaService();
