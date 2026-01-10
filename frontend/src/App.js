import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import DownloadPage from './pages/DownloadPage';
import PWAInstallPrompt from './components/PWAInstallPrompt';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:conversationId" element={<ChatPage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/install" element={<DownloadPage />} />
        </Routes>
        <PWAInstallPrompt />
      </BrowserRouter>
    </div>
  );
}

export default App;
