---
title: ChatHDI API
emoji: 🤖
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
license: mit
app_port: 7860
---

# ChatHDI Backend API

AI-powered chat assistant for R&D Engineering with Hydrogen & Renewable Energy focus.

## Features

- 🤖 Multi-model AI chat (Groq, Gemini, OpenAI)
- 🎨 Image generation with HuggingFace
- 📊 R&D Database integration
- 📑 PowerPoint generation

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/chat` - Chat with AI
- `POST /api/generate/image` - Generate images
- `GET /api/rnd/all` - Get R&D database

## Environment Variables

Set these in your Space settings:

- `GROQ_API_KEY` - Required for chat
- `HUGGINGFACE_API_KEY` - Required for image generation
- `GEMINI_API_KEY` - Optional
- `CORS_ORIGINS` - Your frontend URL
