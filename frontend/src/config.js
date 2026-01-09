// Configuration for ChatHDI
// Uses environment variable for production, fallback to localhost for development

const config = {
    // API URL - set REACT_APP_API_URL in environment for production
    // Remove trailing slash to prevent double slash issues
    API_URL: (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace(/\/+$/, ''),

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
