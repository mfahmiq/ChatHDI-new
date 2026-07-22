// Configuration for ChatHDI
// Uses environment variable for production, fallback to localhost for development

const config = {
    // API URL - set NEXT_PUBLIC_API_URL in environment for production
    // Remove trailing slash to prevent double slash issues
    API_URL: (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/+$/, ''),
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

    // Public URL for Sharing (Required for Electron/Desktop App)
    APP_URL: process.env.NEXT_PUBLIC_PUBLIC_URL || 'http://localhost:3000',

    // App version
    VERSION: '2.3.0',

    // Feature flags
    FEATURES: {
        IMAGE_GENERATION: true,
        VIDEO_GENERATION: true,
        PPTX_GENERATION: true,
        RND_DATABASE: true
    },

    // Admin Users (Emails)
    ADMIN_EMAILS: (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean)
};

// Log config in development mode
if (process.env.NODE_ENV === 'development') {
    console.log('ChatHDI Config:', {
        API_URL: config.API_URL,
        VERSION: config.VERSION
    });
}

export default config;
