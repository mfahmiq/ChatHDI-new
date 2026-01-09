"""
Test suite for ChatHDI AI Chat functionality
"""
import pytest
import httpx
import os
from dotenv import load_dotenv

# Load environment
load_dotenv('/app/frontend/.env')
API_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')

@pytest.mark.asyncio
async def test_chat_endpoint_hdi4():
    """Test chat with HDI-4 (GPT-4o) model"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{API_URL}/api/chat",
            json={
                "messages": [{"role": "user", "content": "Apa itu hidrogen?"}],
                "model": "hdi-4"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "model" in data
        assert data["model"] == "hdi-4"
        assert len(data["response"]) > 50  # Should have substantial response
        assert "Error" not in data["response"][:20]  # Should not start with error
        print(f"✅ HDI-4 Response preview: {data['response'][:100]}...")

@pytest.mark.asyncio
async def test_chat_endpoint_claude():
    """Test chat with HDI-Vision (Claude) model"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{API_URL}/api/chat",
            json={
                "messages": [{"role": "user", "content": "Jelaskan PEM electrolyzer"}],
                "model": "hdi-vision"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert data["model"] == "hdi-vision"
        assert len(data["response"]) > 50
        print(f"✅ Claude Response preview: {data['response'][:100]}...")

@pytest.mark.asyncio
async def test_conversation_context():
    """Test that conversation context is maintained"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        # First message
        response1 = await client.post(
            f"{API_URL}/api/chat",
            json={
                "messages": [{"role": "user", "content": "Nama saya Budi"}],
                "model": "hdi-4-mini"
            }
        )
        assert response1.status_code == 200
        
        # Second message with context
        response2 = await client.post(
            f"{API_URL}/api/chat",
            json={
                "messages": [
                    {"role": "user", "content": "Nama saya Budi"},
                    {"role": "assistant", "content": response1.json()["response"]},
                    {"role": "user", "content": "Siapa nama saya?"}
                ],
                "model": "hdi-4-mini"
            }
        )
        assert response2.status_code == 200
        data = response2.json()
        # Check if response mentions Budi
        assert "Budi" in data["response"] or "budi" in data["response"].lower()
        print(f"✅ Context test passed: {data['response'][:100]}...")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_chat_endpoint_hdi4())
    asyncio.run(test_chat_endpoint_claude())
    asyncio.run(test_conversation_context())
