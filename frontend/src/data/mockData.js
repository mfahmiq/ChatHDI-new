// Enhanced Mock data for ChatHDI with Projects/Folders

export const mockProjects = [
  {
    id: 'proj-1',
    name: 'Website Development',
    icon: '🌐',
    color: '#10b981',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    conversations: ['conv-1', 'conv-2']
  },
  {
    id: 'proj-2',
    name: 'Machine Learning',
    icon: '🤖',
    color: '#8b5cf6',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    conversations: ['conv-3']
  },
  {
    id: 'proj-3',
    name: 'Marketing Ideas',
    icon: '💡',
    color: '#f59e0b',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    conversations: ['conv-4']
  }
];

export const mockConversations = [
  {
    id: 'conv-1',
    projectId: 'proj-1',
    title: 'React Hooks Tutorial',
    isPinned: true,
    tags: ['react', 'frontend'],
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    messages: [
      {
        id: '1-1',
        role: 'user',
        content: 'Jelaskan tentang React Hooks',
        timestamp: new Date(Date.now() - 1000 * 60 * 35)
      },
      {
        id: '1-2',
        role: 'assistant',
        content: 'React Hooks adalah fitur yang diperkenalkan di React 16.8 yang memungkinkan Anda menggunakan state dan fitur React lainnya tanpa menulis class component.\n\n**Hooks Utama:**\n\n1. **useState** - Untuk mengelola state lokal\n2. **useEffect** - Untuk side effects\n3. **useContext** - Untuk mengakses context\n4. **useReducer** - Untuk state management kompleks\n5. **useCallback** - Untuk memoize callback\n6. **useMemo** - Untuk memoize nilai\n\n```javascript\nimport { useState, useEffect } from "react";\n\nfunction Example() {\n  const [count, setCount] = useState(0);\n\n  useEffect(() => {\n    document.title = `Clicked ${count} times`;\n  }, [count]);\n\n  return (\n    <button onClick={() => setCount(count + 1)}>\n      Clicked {count} times\n    </button>\n  );\n}\n```',
        timestamp: new Date(Date.now() - 1000 * 60 * 34)
      }
    ]
  },
  {
    id: 'conv-2',
    projectId: 'proj-1',
    title: 'FastAPI REST API',
    isPinned: false,
    tags: ['python', 'backend'],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    messages: [
      {
        id: '2-1',
        role: 'user',
        content: 'Bagaimana cara membuat REST API dengan FastAPI?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      {
        id: '2-2',
        role: 'assistant',
        content: 'FastAPI adalah framework Python modern untuk membangun API dengan performa tinggi.\n\n**Instalasi:**\n```bash\npip install fastapi uvicorn\n```\n\n**Contoh Dasar:**\n```python\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/")\nasync def root():\n    return {"message": "Hello World"}\n\n@app.get("/items/{item_id}")\nasync def read_item(item_id: int):\n    return {"item_id": item_id}\n```\n\n**Menjalankan:**\n```bash\nuvicorn main:app --reload\n```\n\nFastAPI otomatis menghasilkan dokumentasi OpenAPI di `/docs`!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 30000)
      }
    ]
  },
  {
    id: 'conv-3',
    projectId: 'proj-2',
    title: 'Neural Network Basics',
    isPinned: false,
    tags: ['ml', 'ai'],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    messages: [
      {
        id: '3-1',
        role: 'user',
        content: 'Jelaskan neural network dengan sederhana',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24)
      },
      {
        id: '3-2',
        role: 'assistant',
        content: 'Neural Network adalah model komputasi yang terinspirasi dari cara kerja otak manusia.\n\n**Komponen Utama:**\n\n🧠 **Neuron/Node** - Unit pemrosesan dasar\n🔗 **Layer** - Kumpulan neuron (Input, Hidden, Output)\n⚡ **Weights** - Kekuatan koneksi antar neuron\n📊 **Activation Function** - Menentukan output neuron\n\n**Cara Kerja:**\n1. Data masuk melalui Input Layer\n2. Diproses melalui Hidden Layer(s)\n3. Menghasilkan output di Output Layer\n4. Error dihitung dan weights diperbarui (Backpropagation)\n\n```python\nimport tensorflow as tf\n\nmodel = tf.keras.Sequential([\n    tf.keras.layers.Dense(128, activation="relu"),\n    tf.keras.layers.Dense(64, activation="relu"),\n    tf.keras.layers.Dense(10, activation="softmax")\n])\n```',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 60000)
      }
    ]
  },
  {
    id: 'conv-4',
    projectId: 'proj-3',
    title: 'Social Media Strategy',
    isPinned: true,
    tags: ['marketing', 'social'],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    messages: [
      {
        id: '4-1',
        role: 'user',
        content: 'Berikan strategi marketing untuk startup tech',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5)
      },
      {
        id: '4-2',
        role: 'assistant',
        content: 'Berikut strategi marketing efektif untuk startup tech:\n\n**🎯 1. Content Marketing**\n- Blog teknis dan tutorial\n- Video demo produk\n- Case studies\n\n**📱 2. Social Media**\n- LinkedIn untuk B2B\n- Twitter untuk tech community\n- YouTube untuk tutorials\n\n**🤝 3. Community Building**\n- Discord/Slack community\n- Webinar dan workshop\n- Open source contributions\n\n**📧 4. Email Marketing**\n- Newsletter mingguan\n- Product updates\n- Early access programs\n\n**📊 5. Data-Driven Approach**\n- A/B testing\n- Analytics tracking\n- Customer feedback loops',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5 + 60000)
      }
    ]
  },
  {
    id: 'conv-5',
    projectId: null,
    title: 'Tips Produktivitas',
    isPinned: false,
    tags: ['personal'],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    messages: [
      {
        id: '5-1',
        role: 'user',
        content: 'Berikan tips produktivitas kerja',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48)
      },
      {
        id: '5-2',
        role: 'assistant',
        content: 'Berikut tips produktivitas yang efektif:\n\n**⏰ Time Management**\n- Pomodoro Technique (25 min kerja, 5 min istirahat)\n- Time blocking untuk tugas penting\n- Batasi meeting maksimal 30 menit\n\n**🎯 Focus**\n- Matikan notifikasi saat deep work\n- Gunakan app blocker untuk social media\n- Satu tugas dalam satu waktu\n\n**💪 Energy Management**\n- Tidur 7-8 jam\n- Olahraga rutin\n- Healthy snacks\n\n**📋 Organization**\n- Todo list setiap pagi\n- Review mingguan\n- Clean workspace',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48 + 60000)
      }
    ]
  }
];

export const aiModels = [
  // === AIML API - Top Models (FREE 50k credits) ===
  // { id: 'hdi-gpt4o', name: 'GPT-4o', description: 'OpenAI terkuat via AIML (Gratis)', icon: '🧠', category: 'chat', badge: '🆓 Free' },
  // { id: 'hdi-gpt4o-mini', name: 'GPT-4o Mini', description: 'OpenAI cepat via AIML (Gratis)', icon: '⚡', category: 'chat', badge: '🆓 Free' },
  // { id: 'hdi-claude', name: 'Claude 3.7 Sonnet', description: 'Anthropic coding via AIML (Gratis)', icon: '🤖', category: 'chat', badge: '💻 Code' },
  // { id: 'hdi-claude-haiku', name: 'Claude 3.5 Haiku', description: 'Claude cepat & murah (Gratis)', icon: '🐇', category: 'chat' },
  // { id: 'hdi-llama', name: 'Llama 3.3 70B', description: 'Meta Llama via AIML (Gratis)', icon: '🦙', category: 'chat' },
  // { id: 'hdi-gemma', name: 'Gemma 3 27B', description: 'Google open source (Gratis)', icon: '💎', category: 'chat' },

  // === GROQ - Ultra Fast (FREE) ===
  { id: 'hdi-grok', name: 'Groq Llama 70B', description: 'Super cepat via Groq', icon: '🌌', category: 'chat', badge: '⚡ Fast' },
  { id: 'hdi-grok-mini', name: 'Groq Llama 8B', description: 'Instant via Groq', icon: '🌠', category: 'chat' },

  // === WEB SEARCH (FREE) ===
  { id: 'hdi-search', name: 'Web Search', description: 'Cari info terkini dari internet', icon: '🔍', category: 'chat', badge: '🌐 Live' },

  // === DIRECT GEMINI (FREE) === [DISABLED]
  // { id: 'hdi-4', name: 'Gemini 1.5 Flash', description: 'Google direct API (Gratis)', icon: '💫', category: 'chat' },
  // { id: 'hdi-vision', name: 'Gemini Vision', description: 'Analisis gambar (Gratis)', icon: '👁️', category: 'chat' },
  // { id: 'hdi-code', name: 'Gemini Code', description: 'Spesialis coding (Gratis)', icon: '💻', category: 'chat' },

  // === VERCEL (Requires Credit Card) ===
  // { id: 'hdi-gemini', name: 'Gemini 2.0 Flash', description: 'Via Vercel (perlu kartu)', icon: '✨', category: 'chat', badge: '💳' },
  // { id: 'hdi-gemini-search', name: 'Gemini + Search', description: 'Google Search (perlu kartu)', icon: '🔍', category: 'chat', badge: '💳' },

  // === IMAGE & VIDEO (FREE) ===
  { id: 'hdi-image', name: 'HDI Image', description: 'Generate gambar ', icon: '🎨', category: 'image' },
  { id: 'hdi-image-flux', name: 'FLUX.1', description: 'Model terbaru ', icon: '✨', category: 'image' },
  // { id: 'hdi-video', name: 'HDI Video', description: 'Generate video (Gratis)', icon: '🎬', category: 'video' } [DISABLED]
];

export const generateMockResponse = (userMessage) => {
  const lowerMessage = userMessage.toLowerCase();

  // Greeting responses
  if (lowerMessage.match(/^(halo|hai|hello|hi|hey|selamat|pagi|siang|sore|malam)/)) {
    const greetings = [
      'Halo! 👋 Ada yang bisa saya bantu hari ini?',
      'Hai! Senang bertemu dengan Anda. Apa yang ingin Anda tanyakan?',
      'Hello! Saya ChatHDI, siap membantu Anda. Silakan ajukan pertanyaan.',
      'Hai! 😊 Saya di sini untuk membantu. Apa yang ada di pikiran Anda?'
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Thanks responses
  if (lowerMessage.match(/(terima kasih|thanks|thank you|makasih|thx)/)) {
    const thanks = [
      'Sama-sama! 😊 Senang bisa membantu. Ada pertanyaan lain?',
      'Dengan senang hati! Jangan ragu untuk bertanya lagi.',
      'Terima kasih kembali! Semoga informasinya bermanfaat.',
      'You\'re welcome! Ada hal lain yang bisa saya bantu?'
    ];
    return thanks[Math.floor(Math.random() * thanks.length)];
  }

  // Coding/Programming
  if (lowerMessage.match(/(code|kode|program|coding|javascript|python|react|function|bug|error|debug)/)) {
    if (lowerMessage.includes('react')) {
      return `## React Development\n\nBerikut panduan untuk React:\n\n### Membuat Komponen:\n\n\`\`\`jsx\nimport React, { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div className=\"counter\">\n      <h2>Count: {count}</h2>\n      <button onClick={() => setCount(count + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}\n\nexport default Counter;\n\`\`\`\n\n### Tips:\n- Gunakan **useState** untuk state management sederhana\n- Gunakan **useEffect** untuk side effects\n- Pisahkan komponen menjadi unit kecil yang reusable\n\nApa yang ingin Anda buat dengan React?`;
    }
    if (lowerMessage.includes('python')) {
      return `## Python Programming\n\nContoh kode Python:\n\n\`\`\`python\n# Fungsi untuk menghitung faktorial\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\n# List comprehension\nnumbers = [1, 2, 3, 4, 5]\nsquares = [x**2 for x in numbers]\n\n# Dictionary\ndata = {\n    "name": "ChatHDI",\n    "version": "1.0",\n    "features": ["AI", "R&D Database"]\n}\n\nprint(f"Squares: {squares}")\n\`\`\`\n\nApa yang ingin Anda buat dengan Python?`;
    }
    return `## Bantuan Coding\n\nSaya bisa membantu Anda dengan:\n\n- **Debug** kode yang error\n- **Review** dan optimasi kode\n- **Menulis** kode baru\n- **Menjelaskan** konsep programming\n\nBahasa yang saya kuasai:\n- JavaScript/TypeScript\n- Python\n- Java\n- C/C++\n- Dan banyak lagi\n\nSilakan share kode Anda atau jelaskan apa yang ingin dibuat!`;
  }

  // Hydrogen topics
  if (lowerMessage.match(/(hidrogen|hydrogen|elektrolisis|electrolysis|h2|green hydrogen)/)) {
    return `## Teknologi Green Hydrogen\n\n**Green hydrogen** adalah hidrogen yang diproduksi dari elektrolisis air menggunakan energi terbarukan.\n\n### Metode Produksi:\n\n| Metode | Efisiensi | Biaya |\n|--------|-----------|-------|\n| Alkaline | 60-70% | $1,000-1,500/kW |\n| PEM | 65-80% | $1,500-2,500/kW |\n| SOEC | >80% | $2,500-4,000/kW |\n\n### Keunggulan Green H2:\n- Zero carbon emissions\n- Energy storage capability\n- Versatile applications\n\n### Aplikasi:\n1. **Transportasi** - Fuel cell vehicles\n2. **Industri** - Steel, ammonia production\n3. **Power** - Grid balancing\n\nAnda bisa eksplorasi lebih lanjut di **R&D Database**. Ada aspek spesifik yang ingin dibahas?`;
  }

  // Fuel cell
  if (lowerMessage.match(/(fuel cell|sel bahan bakar|pemfc|sofc|fcev)/)) {
    return `## Teknologi Fuel Cell\n\nFuel cell mengkonversi H2 + O2 → Listrik + Air\n\n### Tipe Utama:\n\n**1. PEMFC (Proton Exchange Membrane)**\n- Suhu: 60-80°C\n- Aplikasi: Kendaraan, portable\n- Efisiensi: 40-60%\n\n**2. SOFC (Solid Oxide)**\n- Suhu: 600-1000°C\n- Aplikasi: Stationary power\n- Efisiensi: 50-65%\n\n### Komponen Utama:\n\`\`\`\nFuel Cell Stack\n├── Bipolar Plates\n├── MEA (Membrane Electrode Assembly)\n│   ├── Anode catalyst\n│   ├── Membrane (Nafion)\n│   └── Cathode catalyst\n└── Gas Diffusion Layers\n\`\`\`\n\nAda pertanyaan spesifik tentang fuel cell?`;
  }

  // Renewable energy
  if (lowerMessage.match(/(renewable|terbarukan|solar|surya|wind|angin|energi|energy|listrik)/)) {
    return `## Energi Terbarukan\n\n### Status Global 2024:\n- **Solar PV**: 1,200+ GW\n- **Wind**: 900+ GW  \n- **Hydro**: 1,400 GW\n\n### Indonesia:\n\n| Sumber | Potensi | Terpasang |\n|--------|---------|----------|\n| Solar | 207 GW | ~300 MW |\n| Wind | 60 GW | ~150 MW |\n| Geothermal | 29 GW | 2.1 GW |\n| Hydro | 75 GW | 6 GW |\n\n### Tren Teknologi:\n1. **Perovskite Solar** - Efisiensi >25%\n2. **Offshore Wind** - Floating turbines\n3. **Battery Storage** - Grid-scale\n4. **Green Hydrogen** - Long-term storage\n\nTopik mana yang ingin Anda pelajari lebih dalam?`;
  }

  // Business/startup - check BEFORE AI
  if (lowerMessage.match(/(bisnis|business|startup|usaha|perusahaan|company|sukses|success|wirausaha|entrepreneur|founder)/)) {
    return `## Membangun Startup yang Sukses\n\nBerikut panduan langkah demi langkah:\n\n### 1. Validasi Ide\n- Identifikasi **masalah nyata** yang dialami banyak orang\n- Pastikan ada **willingness to pay**\n- Talk to potential customers\n\n### 2. Build MVP (Minimum Viable Product)\n- Fokus pada fitur inti saja\n- Launch cepat, iterasi berdasarkan feedback\n- "Done is better than perfect"\n\n### 3. Product-Market Fit\n- Ukur dengan retention rate\n- Net Promoter Score (NPS)\n- Organic growth\n\n### 4. Scaling\n- Optimize unit economics\n- Build team yang solid\n- Cari funding jika perlu\n\n### Tips dari Founder Sukses:\n- **Persistensi** - Jangan menyerah terlalu cepat\n- **Adaptasi** - Pivot jika diperlukan\n- **Network** - Bangun koneksi dengan mentor\n\n### Resources:\n- Y Combinator Startup School\n- Lean Startup by Eric Ries\n- Zero to One by Peter Thiel\n\nAda aspek spesifik yang ingin dibahas?`;
  }

  // AI/Machine Learning
  if (lowerMessage.match(/(artificial intelligence|machine learning|deep learning|neural network|tensorflow|pytorch)/)) {
    return `## Artificial Intelligence & Machine Learning\n\n### Konsep Dasar:\n\n**Machine Learning** adalah subset AI dimana sistem belajar dari data.\n\n### Tipe ML:\n\n1. **Supervised Learning**\n   - Classification, Regression\n   - Contoh: Spam detection\n\n2. **Unsupervised Learning**\n   - Clustering, Dimensionality reduction\n   - Contoh: Customer segmentation\n\n3. **Reinforcement Learning**\n   - Agent learns from environment\n   - Contoh: Game AI, Robotics\n\n### Framework Populer:\n- **TensorFlow** - Google\n- **PyTorch** - Meta\n- **Scikit-learn** - Classic ML\n- **Hugging Face** - NLP/LLM\n\nApa aspek AI yang ingin Anda pelajari?`;
  }

  // Research/R&D
  if (lowerMessage.match(/(research|riset|paper|jurnal|publikasi|studi|lab|laboratorium)/)) {
    return `## Research & Development\n\nChatHDI dilengkapi dengan **R&D Database** yang berisi:\n\n### 📚 Publikasi Riset\n- Paper tentang Hydrogen & Renewable Energy\n- Jurnal internasional terindeks\n- Filter berdasarkan topik & tahun\n\n### 🔬 Alat Laboratorium\n- Database peralatan lab\n- Spesifikasi teknis\n- Status ketersediaan\n\n### 🧪 Material & Bahan\n- Katalog catalyst & membrane\n- Info supplier & harga\n- MSDS dan penanganan\n\n### 🏛️ Institusi Riset\n- NREL, Fraunhofer, ITB, BRIN\n- Fokus riset & fasilitas\n- Info kontak\n\nKlik tombol **R&D Database** di header untuk mengakses. Ada topik riset spesifik?`;
  }

  // General questions - varied responses
  const generalResponses = [
    `Pertanyaan menarik tentang "${userMessage.slice(0, 30)}..."!\n\nSaya akan mencoba menjawab sebaik mungkin. Bisa Anda jelaskan lebih detail:\n\n1. **Konteks** - Untuk keperluan apa?\n2. **Spesifik** - Aspek mana yang paling penting?\n3. **Output** - Hasil seperti apa yang diharapkan?\n\nDengan informasi lebih lengkap, saya bisa memberikan jawaban yang lebih tepat.`,

    `Terima kasih atas pertanyaan Anda!\n\nUntuk memberikan jawaban terbaik tentang topik ini, saya perlu memahami:\n\n- **Tujuan Anda** - Apa yang ingin dicapai?\n- **Latar belakang** - Seberapa familiar Anda dengan topik ini?\n- **Preferensi** - Ada pendekatan tertentu yang disukai?\n\nSilakan berikan detail tambahan.`,

    `Saya siap membantu dengan pertanyaan Anda!\n\n### Cara saya bisa membantu:\n\n1. **Menjelaskan konsep** dengan bahasa sederhana\n2. **Memberikan contoh** praktis\n3. **Menyediakan resources** untuk belajar lebih lanjut\n4. **Brainstorming** ide bersama\n\nApa aspek spesifik yang ingin kita bahas?`,

    `Topik yang Anda tanyakan cukup luas. Mari kita breakdown:\n\n**Untuk memberikan jawaban yang tepat:**\n\n- Jelaskan **konteks** penggunaan\n- Sebutkan **kendala** atau batasan yang ada\n- Tentukan **prioritas** - apa yang paling penting?\n\nSaya akan memberikan jawaban yang disesuaikan dengan kebutuhan Anda.`
  ];

  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
};
