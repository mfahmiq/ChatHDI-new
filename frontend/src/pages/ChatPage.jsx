
import React from 'react';
import { Menu, Shield, PanelRightOpen, PanelRightClose, Sparkles, BookOpen, Presentation, FileText, Share2, Database } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import WelcomeScreen from '../components/WelcomeScreen';
import Canvas from '../components/Canvas';
import RnDDatabase from '../components/RnDDatabase';
import PPTGeneratorModal from '../components/PPTGeneratorModal';
import ExportModal from '../components/ExportModal';
import PromptLibraryModal from '../components/PromptLibraryModal';
import { mockProjects, aiModels } from '../data/mockData';
import config from '../config';
import {
  fetchConversationsFromSupabase,
  saveConversationToSupabase,
  deleteConversationFromSupabase,
  fetchProjectsFromSupabase,
  createProjectInSupabase,
  deleteProjectFromSupabase
} from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const ChatPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = React.useState([]);
  const [conversations, setConversations] = React.useState([]);
  const [activeConversation, setActiveConversation] = React.useState(null);
  const [activeProject, setActiveProject] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState('hdi-grok');
  const [canvasOpen, setCanvasOpen] = React.useState(false);
  const [canvasCode, setCanvasCode] = React.useState('');
  const [canvasLanguage, setCanvasLanguage] = React.useState('');
  const [rndDatabaseOpen, setRndDatabaseOpen] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [showAdminLogin, setShowAdminLogin] = React.useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = React.useState('');
  const [pptModalOpen, setPptModalOpen] = React.useState(false);
  const [pptLoading, setPptLoading] = React.useState(false);
  const [exportModalOpen, setExportModalOpen] = React.useState(false);
  const [exportLoading, setExportLoading] = React.useState(false);
  const [exportContent, setExportContent] = React.useState('');
  const [promptModalOpen, setPromptModalOpen] = React.useState(false);
  const [inputMessage, setInputMessage] = React.useState(''); // Lift state up for ChatInput
  const messagesEndRef = React.useRef(null);

  // Load data from Supabase
  React.useEffect(() => {
    if (!user) return; // Don't fetch if not logged in
    const loadData = async () => {
      try {
        const [convs, projs] = await Promise.all([
          fetchConversationsFromSupabase(user.id),
          fetchProjectsFromSupabase(user.id)
        ]);
        setConversations(convs);
        setProjects(projs);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, [user]);

  const saveConversationToBackend = async (conv) => {
    try {
      await saveConversationToSupabase(conv);
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const handleNewChat = () => {
    // Escape mechanism: If already in "New Chat" mode (activeConversation is null)
    // and a project is selected, clear the project selection.
    if (!activeConversation && activeProject) {
      setActiveProject(null);
    }
    setActiveConversation(null);
    setIsMobileSidebarOpen(false);
  };

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    // Automatically switch project context to match the conversation
    // This allows seamless jumping between folders and global chats
    setActiveProject(conv.projectId || null);
  };

  const handleDeleteConversation = async (id) => {
    try {
      await deleteConversationFromSupabase(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversation?.id === id) {
        setActiveConversation(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleRenameConversation = (id, newTitle) => {
    setConversations(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, title: newTitle };
        saveConversationToBackend(updated);
        return updated;
      }
      return c;
    }));
    if (activeConversation?.id === id) {
      setActiveConversation(prev => ({ ...prev, title: newTitle }));
    }
  };

  const handleTogglePin = (id) => {
    setConversations(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, isPinned: !c.isPinned };
        saveConversationToBackend(updated);
        return updated;
      }
      return c;
    }));
    if (activeConversation?.id === id) {
      setActiveConversation(prev => ({ ...prev, isPinned: !prev.isPinned }));
    }
  };

  const handleCreateProject = async (name) => {
    const newProject = {
      id: crypto.randomUUID(),
      user_id: user.id,
      name,
      icon: '📁',
      color: '#6366f1',
      conversations: [] // Not used in DB, but helpful for UI optimistically
    };

    // Optimistic update
    setProjects(prev => [newProject, ...prev]);
    setActiveProject(newProject.id);
    setActiveConversation(null);

    try {
      await createProjectInSupabase(newProject);
    } catch (error) {
      console.error("Failed to create project:", error);
      // Revert if failed (optional, but good practice)
    }
  };

  const handleDeleteProject = async (projectId) => {
    // Optimistic update
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (activeProject === projectId) setActiveProject(null);

    // Update conversations UI to remove project association
    setConversations(prev => prev.map(c =>
      c.projectId === projectId ? { ...c, projectId: null } : c
    ));

    try {
      await deleteProjectFromSupabase(projectId);
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleMoveToProject = async (convId, projectId) => {
    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        const updated = { ...c, projectId };
        saveConversationToBackend(updated);
        return updated;
      }
      return c;
    }));
  };

  const getAIResponse = async (conv, userMessage, modelOverride = null) => {
    setIsLoading(true);

    try {
      // Prepare messages for API
      const apiMessages = conv.messages.map(msg => {
        let content = msg.content;

        if (msg.attachments && msg.attachments.length > 0) {
          const attachmentsContent = msg.attachments
            .filter(att => att.type === 'file' && (att.content || att.textContext))
            .map(att => {
              if (att.textContext) {
                return `\n\n-- - Content of ${att.name} ---\n${att.textContext} \n-- - End Content-- -\n`;
              }
              return `\n\n-- - Content of ${att.name} ---\n${att.content} \n-- - End of ${att.name} --- `;
            })
            .join('');

          if (attachmentsContent) {
            content += attachmentsContent;
          }
        }

        // Inject historical RAG context if it exists (Hidden from UI, visible to AI)
        if (msg.ragContext) {
          content += msg.ragContext;
        }

        return {
          role: msg.role,
          content: content
        };
      });

      const lastMessage = apiMessages[apiMessages.length - 1]?.content || '';

      // Variable to capture new context for the CURRENT message
      let newRagContext = '';

      // --- PERSONAL RAG LOGIC ---
      // Search for relevant context in Supabase Documents
      try {
        console.log("RAG: Starting search for query:", lastMessage);

        const { searchPersonalDocuments, fetchDocumentByName } = await import('../supabaseClient');
        let contextText = '';
        // Lower threshold to 0.4 to capture broader intent (e.g., "analyze this")
        const contextDocs = await searchPersonalDocuments(lastMessage, 0.4);

        console.log("RAG: Vector search match count:", contextDocs ? contextDocs.length : 0);

        if (contextDocs && contextDocs.length > 0) {
          contextText = contextDocs.map(doc =>
            `-- Source: ${doc.document_name} [${doc.is_shared ? 'COMPANY KNOWLEDGE BASE' : 'PERSONAL DOCUMENT'}]--\n${doc.content} \n`
          ).join('\n');
          console.log("RAG: Context injected via Vector Search");
        } else {
          // Fallback: Check if message references a file and fetch it directly (for "summarize this" queries)
          // Match [File: name] OR [PDF Indexed: name] OR [PDF Indexed (Shared): name]
          // Regex handles optional (Shared) or (Private) parts
          const fileMatch = lastMessage.match(/\[(?:File|PDF Indexed)(?:\s*\(.*?\))?:\s*(.*?)(?:\]|$)/i);
          console.log("RAG: Fallback regex match:", fileMatch);

          if (fileMatch && fileMatch[1]) {
            let fileName = fileMatch[1].trim();
            // Handle URL encoded filenames if any
            try { fileName = decodeURIComponent(fileName); } catch (e) { }

            console.log("RAG: Attempting fallback fetch for file:", fileName);
            const fileContent = await fetchDocumentByName(fileName);
            console.log("RAG: Fetch result length:", fileContent ? fileContent.length : 0);

            if (fileContent) {
              contextText = `-- Source: ${fileName} (Beginning of Document)--\n${fileContent} \n`;
              console.log("RAG: Context injected via Direct Fetch");
            }
          }
        }

        if (contextText) {
          console.log("RAG: Injecting context into message. Length:", contextText.length);
          // Format the context
          newRagContext = `\n\n[System: Gunakan informasi berikut dari dokumen pengguna untuk menjawab jika relevan]\n${contextText} \n[End System]`;

          // Inject into current API payload
          apiMessages[apiMessages.length - 1].content += newRagContext;
        } else {
          console.log("RAG: No context found to inject.");
        }
      } catch (ragError) {
        console.error("RAG Search failed:", ragError);
        // Continue without context
      }
      // --------------------------

      const pptxRegex = /\b(?:buat|buatkan|bikin|generate|create|susun)\b.*?\b(?:ppt|pptx|presentasi|powerpoint|slide)\b/i;
      const isPPTXRequest = pptxRegex.test(lastMessage);

      const API_URL = config.API_URL;

      if (isPPTXRequest) {
        // Dynamic Import
        const { generatePPTFromText } = await import('../utils/pptGenerator');

        // 1. Ask AI to generate structured content
        const pptPrompt = `\n\n[SYSTEM INSTRUCTION: User wants a PowerPoint presentation. 
        Generate a comprehensive outline in this format:
        #[Presentation Title]
        Slide 1: [Title]
  - [Point 1]
  - [Point 2]
        Slide 2: [Title]
        ...
        Make it detailed and professional.]`;

        // Clone messages and append instruction to the last one
        const pptMessages = [...apiMessages];
        pptMessages[pptMessages.length - 1].content += pptPrompt;

        const response = await fetch(`${config.API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: pptMessages,
            model: modelOverride || selectedModel
          })
        });

        const data = await response.json();
        const aiText = data.response;

        if (!aiText) throw new Error("AI tidak memberikan respons.");

        // 2. Generate PPT Client-Side
        const filename = `Presentation_${Date.now()}.pptx`;
        let pptBase64 = null;
        let success = false;

        try {
          pptBase64 = await generatePPTFromText(aiText, filename);
          success = true;
        } catch (pptError) {
          console.error("PPT Gen Error:", pptError);
        }

        const aiMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: aiText,
          timestamp: new Date(),
          mediaType: success ? 'pptx' : null,
          mediaData: success ? [pptBase64] : null,
          filename: filename
        };

        const updatedConv = { ...conv, messages: [...conv.messages, aiMessage] };
        setActiveConversation(updatedConv);
        setConversations(prev => prev.map(c => c.id === conv.id ? updatedConv : c));
        saveConversationToBackend(updatedConv);
        setIsLoading(false);
        return;
      }

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

      // UPDATE LAST USER MESSAGE WITH RAG CONTEXT FOR PERSISTENCE
      const updatedMessages = [...conv.messages];
      // If we found new context, attach it to the last user message
      if (newRagContext) {
        const lastMsgIndex = updatedMessages.length - 1;
        if (updatedMessages[lastMsgIndex].role === 'user') {
          updatedMessages[lastMsgIndex] = {
            ...updatedMessages[lastMsgIndex],
            ragContext: newRagContext // Persist for future turns!
          };
        }
      }

      const updatedConv = {
        ...conv,
        messages: [...updatedMessages, aiMessage]
      };

      setActiveConversation(updatedConv);
      setConversations(prev => prev.map(c =>
        c.id === conv.id ? updatedConv : c
      ));
      saveConversationToBackend(updatedConv);
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
        id: crypto.randomUUID(),
        user_id: user?.id,
        projectId: activeProject,
        title: content.slice(0, 40) + (content.length > 40 ? '...' : ''),
        isPinned: false,
        tags: [],
        timestamp: new Date(),
        messages: [userMessage]
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversation(newConv);
      saveConversationToBackend(newConv);
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
      saveConversationToBackend(updatedConv);
      await getAIResponse(updatedConv, userMessage, modelOverride);
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
    const targetModel = 'hdi-grok';
    setSelectedModel(targetModel);
    handleSendMessage(prompt, [], targetModel);
  };

  const handleFeatureClick = (feature) => {
    const featurePrompts = {
      'Coding': {
        model: 'hdi-grok',
        message: 'Saya ingin bantuan coding. Apa yang bisa saya bantu? (Jelaskan masalah coding atau kirim kode yang ingin di-review)'
      },
      'Vision': {
        model: 'hdi-grok',
        message: 'Saya siap menganalisis gambar. Silakan upload gambar yang ingin dianalisis.'
      },
      'Documents': {
        model: 'hdi-grok',
        message: 'Saya siap membantu dengan dokumen. Silakan upload dokumen atau jelaskan apa yang ingin dianalisis.'
      },
      'Web Search': {
        model: 'hdi-search',
        message: '🔍 Mode Web Search aktif! Saya akan mencari informasi terkini dari internet untuk menjawab pertanyaan Anda. Apa yang ingin Anda cari?'
      },
      'Deep Think': {
        model: 'hdi-grok',
        message: 'Mode Deep Think aktif. Saya akan menganalisis pertanyaan Anda secara mendalam. Apa yang ingin dibahas?'
      },
      'R&D Database': {
        model: 'hdi-grok',
        action: 'openDatabase'
      },
      'Generate PPT': {
        model: 'hdi-grok',
        action: 'generatePPT'
      },
      'Export Doc': {
        model: 'hdi-grok',
        action: 'exportDoc'
      }
    };

    const config = featurePrompts[feature];
    if (config) {
      if (config.action === 'openDatabase') {
        setRndDatabaseOpen(true);
      } else if (config.action === 'generatePPT') {
        // Open the PPT Generator Modal
        setPptModalOpen(true);
      } else if (config.action === 'exportDoc') {
        // Open Export Modal with conversation content
        if (activeConversation && activeConversation.messages.length > 0) {
          const allContent = activeConversation.messages
            .map(m => `${m.role === 'user' ? '**User:**' : '**ChatHDI:**'}\n${m.content}`)
            .join('\n\n---\n\n');
          handleOpenExportModal(allContent);
        } else {
          alert('Belum ada percakapan untuk diekspor. Mulai chat terlebih dahulu.');
        }
      } else {
        setSelectedModel(config.model);
      }
    }
  };

  const handleOpenCanvas = (code, language) => {
    setCanvasCode(code);
    setCanvasLanguage(language);
    setCanvasOpen(true);
  };

  const handleGeneratePPT = async (content) => {
    setIsLoading(true);
    try {
      // Dynamic Import
      const { generatePPTFromText } = await import('../utils/pptGenerator');

      // 1. Ask AI to generate structured content from the selected message
      const pptPrompt = `\n\n[SYSTEM INSTRUCTION: User wants to convert the above content into a PowerPoint presentation. 
        Generate a comprehensive outline based on the content above in this format:
        # [Presentation Title]
        Slide 1: [Title]
        - [Point 1]
        - [Point 2]
        Slide 2: [Title]
        ...
        Make it detailed and professional.]`;

      // Create a temporary conversation context to ask for the structure
      const tempMessages = [
        { role: 'user', content: content },
        { role: 'user', content: pptPrompt }
      ];

      const response = await fetch(`${config.API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: tempMessages,
          model: selectedModel
        })
      });

      const data = await response.json();
      const aiText = data.response;

      if (!aiText) throw new Error("AI tidak memberikan respons untuk PPT.");

      // 2. Generate PPT Client-Side
      const filename = `Presentation_${Date.now()}.pptx`;
      const base64 = await generatePPTFromText(aiText, filename);

      // 3. Add a system message with the download
      const aiMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Presentasi berhasil dibuat dari pesan yang dipilih!`,
        timestamp: new Date(),
        mediaType: 'pptx',
        mediaData: [base64],
        filename: filename
      };

      const updatedConv = { ...activeConversation, messages: [...activeConversation.messages, aiMessage] };
      setActiveConversation(updatedConv);
      setConversations(prev => prev.map(c => c.id === activeConversation.id ? updatedConv : c));
      saveConversationToBackend(updatedConv);

    } catch (error) {
      console.error("PPT Generation Error:", error);
      alert("Gagal membuat PPT: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for PPT Modal submission - Shows preview first
  const handlePPTModalGenerate = async ({ title, description, slideCount }) => {
    setPptLoading(true);
    try {
      // Create a detailed prompt for the AI to generate the outline
      const pptPrompt = `Buatkan outline presentasi PowerPoint dengan detail berikut:

**Judul:** ${title}

**Deskripsi/Topik:** ${description || 'Buat konten yang relevan dengan judul'}

**Jumlah Slide:** ${slideCount} slide

Hasilkan outline dalam format ini:
# ${title}
Slide 1: [Title Slide]
- [Subtitle/Tagline]

Slide 2: [Section Title]
- [Point 1]
- [Point 2]
- [Point 3]

... (lanjutkan hingga ${slideCount} slide)

Buat konten yang profesional, informatif, dan sesuai dengan topik.`;

      const response = await fetch(`${config.API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: pptPrompt }],
          model: selectedModel
        })
      });

      const data = await response.json();
      const aiText = data.response;

      if (!aiText) throw new Error("AI tidak memberikan respons untuk PPT.");

      // Show the outline in chat for review (WITHOUT generating PPT yet)
      const previewMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `📋 **Preview Outline Presentasi: "${title}"**\n\n${aiText}\n\n---\n✏️ *Jika outline sudah sesuai, klik tombol **Generate PPT** (📄) di bawah pesan ini untuk membuat file .pptx*\n\n*Atau, Anda bisa meminta saya untuk merevisi outline ini terlebih dahulu.*`,
        timestamp: new Date()
      };

      // Create a new conversation if none exists
      if (!activeConversation) {
        const newConv = {
          id: `conv-${Date.now()}`,
          title: `Presentasi: ${title}`,
          messages: [previewMessage],
          projectId: activeProject,
          createdAt: new Date()
        };
        setActiveConversation(newConv);
        setConversations(prev => [...prev, newConv]);
        saveConversationToBackend(newConv);
      } else {
        // Add to existing conversation
        const updatedConv = { ...activeConversation, messages: [...activeConversation.messages, previewMessage] };
        setActiveConversation(updatedConv);
        setConversations(prev => prev.map(c => c.id === activeConversation.id ? updatedConv : c));
        saveConversationToBackend(updatedConv);
      }

      setPptModalOpen(false);

    } catch (error) {
      console.error("PPT Generation Error:", error);
      alert("Gagal membuat outline PPT: " + error.message);
    } finally {
      setPptLoading(false);
    }
  };

  // Handler for Export Modal submission
  const handleExport = async ({ title, format, content }) => {
    setExportLoading(true);
    try {
      if (format === 'pdf') {
        const { downloadPDF } = await import('../utils/pdfGenerator');
        await downloadPDF(content, title, `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      } else if (format === 'docx') {
        const { downloadWord } = await import('../utils/wordGenerator');
        await downloadWord(content, title, `${title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`);
      }
      setExportModalOpen(false);
    } catch (error) {
      console.error("Export Error:", error);
      alert("Gagal export dokumen: " + error.message);
    } finally {
      setExportLoading(false);
    }
  };

  // Open export modal with content from a message
  const handleOpenExportModal = (content) => {
    setExportContent(content);
    setExportModalOpen(true);
  };

  const handleSelectPrompt = (promptContent) => {
    // This function will be passed to PromptLibraryModal
    setInputMessage(promptContent);
    setPromptModalOpen(false);
  };

  const handleBookmark = (messageId) => {
    if (!activeConversation) return;

    const updatedMessages = activeConversation.messages.map(msg =>
      msg.id === messageId ? { ...msg, isBookmarked: !msg.isBookmarked } : msg
    );

    // Update active conversation
    const updatedConv = { ...activeConversation, messages: updatedMessages };
    setActiveConversation(updatedConv);

    // Update conversations list
    setConversations(prev => prev.map(c => c.id === updatedConv.id ? updatedConv : c));

    // Save to backend
    saveConversationToBackend(updatedConv);
  };

  /* Share Chat Handler */
  const handleShareChat = async () => {
    if (!activeConversation) return;

    // Generate Share Link (Hash Router format)
    const shareUrl = `${window.location.origin}/#/share/${activeConversation.id}`;
    const title = activeConversation.title || 'ChatHDI Conversation';

    const shareData = {
      title: title,
      text: `Check out this conversation: ${title}`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled
      }
    } else {
      // Fallback
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Share Link copied to clipboard!');
      } catch (err) {
        alert('Failed to copy link.');
      }
    }
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
        onDeleteProject={handleDeleteProject}
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
            {/* Share Chat */}
            <button
              onClick={handleShareChat}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#2f2f2f] hover:bg-[#3a3a3a] rounded-lg text-gray-400 hover:text-emerald-400 transition-colors"
              title="Share Chat"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Admin Toggle */}
            <button
              onClick={() => {
                if (isAdmin) {
                  setIsAdmin(false);
                } else {
                  setShowAdminLogin(true);
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isAdmin
                ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                : 'bg-[#2f2f2f] text-gray-400 hover:text-white'
                }`}
              title={isAdmin ? 'Klik untuk matikan Mode Admin' : 'Klik untuk aktifkan Mode Admin (Perlu Password)'}
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
                  onGeneratePPT={handleGeneratePPT}
                  onExport={handleOpenExportModal}
                />
              ))}
              {isLoading && (
                <div className="py-6 bg-[#171717]">
                  <div className="max-w-4xl mx-auto px-4 md:px-8 flex gap-4">
                    <div className="w-9 h-9 flex items-center justify-center">
                      <img src="logo-hdi.png" alt="HDI" className="w-full h-full object-contain" />
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

        <div className="border-t border-[#2f2f2f]">
          <ChatInput
            onSend={handleSendMessage}
            isLoading={isLoading}
            onStop={() => { setIsLoading(false); }}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            activeProject={activeProject}
            activeProjectName={activeProject?.name}
            hasActiveConversation={!!activeConversation}
            user={user}
            isAdmin={isAdmin}
            onOpenPromptLibrary={() => setPromptModalOpen(true)}
            externalMessage={inputMessage}
            onClearExternalMessage={() => setInputMessage('')}
          />
        </div>
      </main>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
          <div className="bg-[#2f2f2f] border border-[#404040] rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Admin Access
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Masukkan password administrator untuk mengaktifkan fitur upload dan manajemen database.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (adminPasswordInput === "hdi2024") {
                setIsAdmin(true);
                setShowAdminLogin(false);
                setAdminPasswordInput('');
              } else {
                alert("Password salah!");
              }
            }}>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Password Admin"
                className="w-full bg-[#171717] border border-[#404040] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminLogin(false);
                    setAdminPasswordInput('');
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white hover:bg-[#404040] rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium"
                >
                  Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Canvas */}
      <Canvas
        isOpen={canvasOpen}
        onClose={() => setCanvasOpen(false)}
        code={canvasCode}
        language={canvasLanguage}
      />

      {/* R&D Database Modal */}
      {rndDatabaseOpen && (
        <RnDDatabase
          isOpen={rndDatabaseOpen}
          onClose={() => setRndDatabaseOpen(false)}
        />
      )}

      {/* PPT Generator Modal */}
      <PPTGeneratorModal
        isOpen={pptModalOpen}
        onClose={() => setPptModalOpen(false)}
        onGenerate={handlePPTModalGenerate}
        isLoading={pptLoading}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
        content={exportContent}
        isLoading={exportLoading}
      />

      {/* Prompt Library Modal */}
      <PromptLibraryModal
        isOpen={promptModalOpen}
        onClose={() => setPromptModalOpen(false)}
        onSelectPrompt={handleSelectPrompt}
      />
    </div>
  );
};

export default ChatPage;

// Force refresh timestamp: 2026-01-28
