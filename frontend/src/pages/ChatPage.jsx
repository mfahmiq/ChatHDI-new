import React from 'react';
import { Menu, Sparkles, Share, PanelRightOpen, PanelRightClose, Database, Shield } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import WelcomeScreen from '../components/WelcomeScreen';
import Canvas from '../components/Canvas';
import RnDDatabase from '../components/RnDDatabase';
import { mockConversations, mockProjects, aiModels } from '../data/mockData';
import config from '../config';

const ChatPage = () => {
  const [projects, setProjects] = React.useState(mockProjects);
  const [conversations, setConversations] = React.useState(mockConversations);
  const [activeConversation, setActiveConversation] = React.useState(null);
  const [activeProject, setActiveProject] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState('hdi-4');
  const [canvasOpen, setCanvasOpen] = React.useState(false);
  const [canvasCode, setCanvasCode] = React.useState('');
  const [canvasLanguage, setCanvasLanguage] = React.useState('');
  const [rndDatabaseOpen, setRndDatabaseOpen] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const handleNewChat = () => {
    setActiveConversation(null);
    setIsMobileSidebarOpen(false);
  };

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
  };

  const handleDeleteConversation = (id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversation?.id === id) {
      setActiveConversation(null);
    }
  };

  const handleRenameConversation = (id, newTitle) => {
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, title: newTitle } : c
    ));
    if (activeConversation?.id === id) {
      setActiveConversation(prev => ({ ...prev, title: newTitle }));
    }
  };

  const handleTogglePin = (id) => {
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, isPinned: !c.isPinned } : c
    ));
    if (activeConversation?.id === id) {
      setActiveConversation(prev => ({ ...prev, isPinned: !prev.isPinned }));
    }
  };

  const handleCreateProject = (name) => {
    const newProject = {
      id: `proj-${Date.now()}`,
      name,
      icon: '📁',
      color: '#6366f1',
      createdAt: new Date(),
      conversations: []
    };
    setProjects(prev => [...prev, newProject]);
    // Auto-select the new project and prepare for new chat
    setActiveProject(newProject.id);
    setActiveConversation(null);
  };

  const handleMoveToProject = (convId, projectId) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, projectId } : c
    ));
  };

  const handleSendMessage = async (content, attachments = [], modelOverride = null) => {
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : null
    };

    if (!activeConversation) {
      const newConv = {
        id: `conv-${Date.now()}`,
        projectId: activeProject,
        title: content.slice(0, 40) + (content.length > 40 ? '...' : ''),
        isPinned: false,
        tags: [],
        timestamp: new Date(),
        messages: [userMessage]
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversation(newConv);
      await getAIResponse(newConv, userMessage, modelOverride);
    } else {
      const updatedConv = {
        ...activeConversation,
        timestamp: new Date(),
        messages: [...activeConversation.messages, userMessage]
      };
      setActiveConversation(updatedConv);
      setConversations(prev => prev.map(c =>
        c.id === activeConversation.id ? updatedConv : c
      ));
      await getAIResponse(updatedConv, userMessage, modelOverride);
    }
  };

  const getAIResponse = async (conv, userMessage, modelOverride = null) => {
    setIsLoading(true);

    try {
      // Prepare messages for API
      const apiMessages = conv.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const lastMessage = apiMessages[apiMessages.length - 1]?.content || '';

      // Check if user is requesting PPTX
      const pptxKeywords = ['buatkan ppt', 'buat ppt', 'buatkan presentasi', 'buat presentasi',
        'generate ppt', 'create ppt', 'powerpoint', 'pptx', 'slide presentasi'];
      const isPPTXRequest = pptxKeywords.some(kw => lastMessage.toLowerCase().includes(kw));

      // Use config (hardcoded for reliability)
      const API_URL = config.API_URL;

      if (isPPTXRequest) {
        // Generate PPTX
        const pptxResponse = await fetch(`${API_URL}/generate/pptx`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: lastMessage })
        });

        const pptxData = await pptxResponse.json();

        const aiMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: pptxData.success
            ? `Saya telah membuat presentasi PowerPoint untuk Anda!\n\n**${pptxData.filename}**\n- ${pptxData.slides_count} slides\n\nKlik tombol download di bawah untuk mengunduh file.`
            : `Maaf, gagal membuat presentasi: ${pptxData.error}`,
          timestamp: new Date(),
          mediaType: pptxData.success ? 'pptx' : null,
          mediaData: pptxData.success ? [pptxData.pptx_base64] : null,
          filename: pptxData.filename
        };

        const updatedConv = { ...conv, messages: [...conv.messages, aiMessage] };
        setActiveConversation(updatedConv);
        setConversations(prev => prev.map(c => c.id === conv.id ? updatedConv : c));
        setIsLoading(false);
        return;
      }

      // Call backend API for regular chat
      const response = await fetch(`${config.API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: modelOverride || selectedModel
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const aiMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'Tidak ada respons dari server.',
        timestamp: new Date(),
        mediaType: data.media_type || null,
        mediaData: data.media_data || null
      };

      const updatedConv = {
        ...conv,
        messages: [...conv.messages, aiMessage]
      };

      setActiveConversation(updatedConv);
      setConversations(prev => prev.map(c =>
        c.id === conv.id ? updatedConv : c
      ));
    } catch (error) {
      console.error('API Error:', error);
      const aiMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Maaf, terjadi kesalahan koneksi. Silakan coba lagi.\n\nError: ${error.message}`,
        timestamp: new Date()
      };

      const updatedConv = {
        ...conv,
        messages: [...conv.messages, aiMessage]
      };

      setActiveConversation(updatedConv);
      setConversations(prev => prev.map(c =>
        c.id === conv.id ? updatedConv : c
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!activeConversation || activeConversation.messages.length < 2) return;
    const messages = activeConversation.messages;
    const lastUserMessageIndex = messages.map(m => m.role).lastIndexOf('user');
    if (lastUserMessageIndex === -1) return;
    const lastUserMessage = messages[lastUserMessageIndex];
    const updatedMessages = messages.slice(0, -1);
    const updatedConv = { ...activeConversation, messages: updatedMessages };
    setActiveConversation(updatedConv);
    setConversations(prev => prev.map(c =>
      c.id === activeConversation.id ? updatedConv : c
    ));
    await getAIResponse(updatedConv, lastUserMessage);
  };

  const handleStopGeneration = () => setIsLoading(false);

  const handleSuggestionClick = (prompt) => {
    const targetModel = 'hdi-grok'; // Groq Llama 70B
    setSelectedModel(targetModel);
    handleSendMessage(prompt, [], targetModel);
  };

  // Handle feature button clicks
  const handleFeatureClick = (feature) => {
    const featurePrompts = {
      'Coding': {
        model: 'hdi-code',
        message: 'Saya ingin bantuan coding. Apa yang bisa saya bantu? (Jelaskan masalah coding atau kirim kode yang ingin di-review)'
      },
      'Vision': {
        model: 'hdi-vision',
        message: 'Saya siap menganalisis gambar. Silakan upload gambar yang ingin dianalisis.'
      },
      'Documents': {
        model: 'hdi-4',
        message: 'Saya siap membantu dengan dokumen. Silakan upload dokumen atau jelaskan apa yang ingin dianalisis.'
      },
      'Web Search': {
        model: 'hdi-4',
        message: 'Saya akan membantu mencari informasi terbaru. Apa yang ingin Anda cari?'
      },
      'Deep Think': {
        model: 'hdi-4',
        message: 'Mode Deep Think aktif. Saya akan menganalisis pertanyaan Anda secara mendalam. Apa yang ingin dibahas?'
      },
      'R&D Database': {
        model: 'hdi-4',
        action: 'openDatabase'
      }
    };

    const config = featurePrompts[feature];
    if (config) {
      if (config.action === 'openDatabase') {
        setRndDatabaseOpen(true);
      } else {
        setSelectedModel(config.model);
        // Don't auto-send, just prepare the model
      }
    }
  };

  const handleOpenCanvas = (code, language) => {
    setCanvasCode(code);
    setCanvasLanguage(language);
    setCanvasOpen(true);
  };

  return (
    <div className="h-screen flex bg-[#212121] text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePin={handleTogglePin}
        onCreateProject={handleCreateProject}
        onMoveToProject={handleMoveToProject}
        activeProject={activeProject}
        onSelectProject={setActiveProject}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#2f2f2f] bg-[#212121]">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-400"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            <h1 className="font-semibold text-lg truncate">
              {activeConversation ? activeConversation.title : 'ChatHDI'}
            </h1>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* Admin Toggle */}
            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isAdmin
                ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                : 'bg-[#2f2f2f] text-gray-400 hover:text-white'
                }`}
              title={isAdmin ? 'Mode Admin aktif' : 'Aktifkan mode Admin'}
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{isAdmin ? 'Admin' : 'User'}</span>
            </button>
            <button
              onClick={() => setRndDatabaseOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium transition-colors"
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">R&D Database</span>
            </button>
            <button className="p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors">
              <Share className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCanvasOpen(!canvasOpen)}
              className={`p-2 hover:bg-[#2f2f2f] rounded-lg transition-colors ${canvasOpen ? 'text-emerald-500' : 'text-gray-400 hover:text-white'
                }`}
            >
              {canvasOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#565869] scrollbar-track-transparent">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <WelcomeScreen
              onSuggestionClick={handleSuggestionClick}
              onFeatureClick={handleFeatureClick}
            />
          ) : (
            <div className="pb-4">
              {activeConversation.messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLast={index === activeConversation.messages.length - 1 && message.role === 'assistant'}
                  onRegenerate={handleRegenerate}
                  onOpenCanvas={handleOpenCanvas}
                />
              ))}
              {isLoading && (
                <div className="py-6 bg-[#171717]">
                  <div className="max-w-4xl mx-auto px-4 md:px-8 flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">H</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-white">ChatHDI</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                          {aiModels.find(m => m.id === selectedModel)?.name || 'HDI-4'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-sm">Sedang berpikir...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStopGeneration}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          activeProject={activeProject}
          activeProjectName={projects.find(p => p.id === activeProject)?.name}
          hasActiveConversation={!!activeConversation}
        />
      </main>

      {/* Canvas */}
      <Canvas
        isOpen={canvasOpen}
        onClose={() => setCanvasOpen(false)}
        code={canvasCode}
        language={canvasLanguage}
      />

      {/* R&D Database */}
      <RnDDatabase
        isOpen={rndDatabaseOpen}
        onClose={() => setRndDatabaseOpen(false)}
        onAskAI={(prompt) => {
          setRndDatabaseOpen(false);
          handleSendMessage(prompt);
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default ChatPage;
