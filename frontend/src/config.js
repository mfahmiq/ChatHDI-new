// Configuration for ChatHDI
// Uses environment variable for production, fallback to localhost for development

const config = {
    // API URL - set REACT_APP_API_URL in environment for production
    // Remove trailing slash to prevent double slash issues
    API_URL: (process.env.REACT_APP_API_URL || 'https://fahmi1-chathdi-be.hf.space/api').replace(/\/+$/, ''),
    SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL || 'https://ziiyznxuxmrrpdnojthc.supabase.co',
    SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaXl6bnh1eG1ycnBkbm9qdGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MzMyNDQsImV4cCI6MjA4NTEwOTI0NH0.MDGjt3dnMJW_9ViluMc_zQA3oQCrBbZ2hRB8Csf7zEA',

    // Public URL for Sharing (Required for Electron/Desktop App)
    APP_URL: process.env.REACT_APP_PUBLIC_URL || 'https://chathdi.vercel.app', // GANTI DENGAN URL DEPLOYMENT ANDA

    // App version
    VERSION: '2.3.0',

    // Feature flags
    FEATURES: {
        IMAGE_GENERATION: true,
        VIDEO_GENERATION: true,
        PPTX_GENERATION: true,
        RND_DATABASE: true
    }
};

// Log config in development mode
if (process.env.NODE_ENV === 'development') {
    console.log('ChatHDI Config:', {
        API_URL: config.API_URL,
        VERSION: config.VERSION
    });
}

export default config;
