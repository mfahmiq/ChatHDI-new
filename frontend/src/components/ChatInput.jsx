import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Sparkles, Mic, Paperclip, FileText, Globe, Lock, StopCircle, ChevronDown, Zap, Code, Eye, Brain, FolderOpen, X, Palette, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { aiModels } from '../data/mockData';

const ChatInput = ({
  onSend,
  isLoading,
  onStop,
  selectedModel,
  onModelChange,
  activeProject,
  activeProjectName,
  hasActiveConversation,
  user,
  isAdmin,
  onOpenPromptLibrary,
  externalMessage,
  onClearExternalMessage
}) => {
  const [message, setMessage] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isSharedUpload, setIsSharedUpload] = useState(false); // Toggle for shared/company data
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef(null);
  const modelSelectorRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (externalMessage) {
      setMessage(externalMessage);
      if (onClearExternalMessage) {
        onClearExternalMessage();
      }
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      }, 100);
    }
  }, [externalMessage, onClearExternalMessage]);

  useEffect(() => {
    // Initialize Speech Recognition if supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'id-ID'; // Set to Indonesian

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTrans = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTrans) {
          setMessage(prev => prev + ' ' + finalTrans);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        // If still supposed to be recording, restart it (browser sometimes stops it)
        if (isRecording) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            setIsRecording(false);
          }
        }
      };
    }
  }, [isRecording]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Browser Anda tidak mendukung fitur input suara.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(e.target)) {
        setShowModelSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !isLoading) {
      // Build message with attachments
      let fullMessage = message.trim();

      if (attachments.length > 0) {
        const attachmentInfo = attachments.map(att => {
          if (att.type === 'image') {
            return `[Gambar: ${att.name}]`;
          } else {
            return att.content.startsWith('[') ? att.content : `[File: ${att.name}]`;
          }
        }).join('\n');

        if (fullMessage) {
          fullMessage = `${fullMessage}\n\n${attachmentInfo}`;
        } else {
          fullMessage = attachmentInfo;
        }
      }

      onSend(fullMessage, attachments);
      setMessage('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  const handleFileSelect = async (e, type) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (type === 'image' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setAttachments(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'image',
            name: file.name,
            size: file.size,
            preview: event.target.result,
            file: file
          }]);
        };
        reader.readAsDataURL(file);
      } else if (type === 'file') {
        const fileType = file.name.split('.').pop().toLowerCase();
        const tempId = Date.now() + Math.random();

        // Initial Loading State
        setAttachments(prev => [...prev, {
          id: tempId,
          type: 'file',
          name: file.name,
          size: file.size,
          content: 'Processing...',
          isLoading: true,
          file: file
        }]);

        try {
          let text = "";
          let isProcessed = false;

          // Helper to process text for RAG
          const processForRAG = async (extractedText) => {
            const { chunkText } = await import('../utils/pdfProcessor'); // Reuse chunker
            const { generateEmbedding, uploadDocument } = await import('../supabaseClient');

            // 1. Chunk
            const chunks = chunkText(extractedText);
            if (chunks.length === 0) throw new Error("Gagal membagi teks.");

            // 2. Embed
            const sections = [];
            for (const chunk of chunks) {
              const embedding = await generateEmbedding(chunk);
              sections.push({ content: chunk, embedding });
            }

            // 3. Upload (with isShared flag)
            let userId = user?.id;
            if (!userId) {
              const { supabase } = await import('../supabaseClient');
              const { data: { user: sessionUser } } = await supabase.auth.getUser();
              userId = sessionUser?.id;
            }

            // ONLY ALLOW SHARED UPLOAD IF IS ADMIN
            const finalIsShared = isAdmin && isSharedUpload;

            const result = await uploadDocument(file, userId, sections, finalIsShared);
            if (!result.success) throw result.error;

            return { finalIsShared, text: extractedText };
          };

          if (fileType === 'pdf') {
            const { extractTextFromPDF } = await import('../utils/pdfProcessor');
            text = await extractTextFromPDF(file);
            if (!text || text.trim().length < 10) throw new Error("PDF kosong atau tidak terbaca.");

            const { finalIsShared, text: fullText } = await processForRAG(text);

            // Success
            setAttachments(prev => prev.map(att => {
              if (att.id === tempId) {
                return {
                  ...att,
                  content: `[PDF Indexed (${finalIsShared ? 'Shared' : 'Private'}): ${file.name}]`,
                  isLoading: false,
                  isIndexed: true,
                  textContext: fullText.substring(0, 100000)
                };
              }
              return att;
            }));
            isProcessed = true;

          } else if (fileType === 'docx') {
            const { extractTextFromDocx } = await import('../utils/docxProcessor');
            text = await extractTextFromDocx(file);
            if (!text || text.trim().length < 10) throw new Error("DOCX kosong atau tidak terbaca.");

            const { finalIsShared, text: fullText } = await processForRAG(text);

            setAttachments(prev => prev.map(att => {
              if (att.id === tempId) {
                return {
                  ...att,
                  content: `[DOCX Indexed (${finalIsShared ? 'Shared' : 'Private'}): ${file.name}]`,
                  isLoading: false,
                  isIndexed: true,
                  textContext: fullText.substring(0, 100000)
                };
              }
              return att;
            }));
            isProcessed = true;

          } else if (['xlsx', 'xls', 'csv'].includes(fileType)) {
            const { extractTextFromExcel } = await import('../utils/excelProcessor');
            text = await extractTextFromExcel(file);
            if (!text || text.trim().length < 10) throw new Error("Excel/CSV kosong atau tidak terbaca.");

            const { finalIsShared, text: fullText } = await processForRAG(text);

            setAttachments(prev => prev.map(att => {
              if (att.id === tempId) {
                return {
                  ...att,
                  content: `[Excel Indexed (${finalIsShared ? 'Shared' : 'Private'}): ${file.name}]`,
                  isLoading: false,
                  isIndexed: true,
                  textContext: fullText.substring(0, 100000)
                };
              }
              return att;
            }));
            isProcessed = true;

          } else {
            // Processing for plain text files (txt, md, etc.) - treating as RAG candidates too if text
            const reader = new FileReader();
            reader.onload = async (event) => {
              try {
                const content = event.target.result;
                if (content && content.length > 10) {
                  // Attempt RAG for text files too
                  const { finalIsShared, text: fullText } = await processForRAG(content);

                  setAttachments(prev => prev.map(att => {
                    if (att.id === tempId) {
                      return {
                        ...att,
                        content: `[Text Indexed (${finalIsShared ? 'Shared' : 'Private'}): ${file.name}]`,
                        isLoading: false,
                        isIndexed: true,
                        textContext: fullText.substring(0, 100000)
                      };
                    }
                    return att;
                  }));
                } else {
                  // Fallback for very short text
                  setAttachments(prev => prev.map(att => {
                    if (att.id === tempId) {
                      return {
                        ...att,
                        content: `[File: ${file.name}]`,
                        isLoading: false,
                        textContext: content.substring(0, 100000)
                      };
                    }
                    return att;
                  }));
                }
              } catch (err) {
                // Fallback if RAG fails for text file
                setAttachments(prev => prev.map(att => {
                  if (att.id === tempId) {
                    return {
                      ...att,
                      content: `[File: ${file.name}] - RAG Failed`,
                      isLoading: false,
                      isError: true
                    };
                  }
                  return att;
                }));
              }
            };
            reader.readAsText(file);
            isProcessed = true; // Handled async inside onload
          }

        } catch (error) {
          console.error("Upload error:", error);
          setAttachments(prev => prev.map(att => {
            if (att.id === tempId) {
              return {
                ...att,
                content: `[Error: ${error.message}]`,
                isLoading: false,
                isError: true
              };
            }
            return att;
          }));
        }
      }
    }
    e.target.value = ''; // Reset input
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const currentModel = aiModels.find(m => m.id === selectedModel) || aiModels[0];
  const modelIcons = {
    'hdi-4': Zap, 'hdi-4-mini': Sparkles, 'hdi-grok': Brain,
    'hdi-grok-mini': Sparkles, 'hdi-vision': Eye, 'hdi-code': Code,
    'hdi-image': Palette, 'hdi-image-flux': Palette
  };
  const ModelIcon = modelIcons[currentModel.id] || Zap;

  return (
    <div className="px-4 py-4 bg-[#212121]">
      <div className="max-w-4xl mx-auto">
        {/* Model Selector */}
        <div className="flex items-center gap-2 mb-3" ref={modelSelectorRef}>
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#2f2f2f] hover:bg-[#3a3a3a] rounded-lg text-sm text-gray-300 transition-colors"
            >
              <ModelIcon className="h-4 w-4 text-emerald-500" />
              <span>{currentModel.name}</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', showModelSelector && 'rotate-180')} />
            </button>
            {showModelSelector && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#2f2f2f] rounded-xl border border-[#424242] shadow-xl overflow-hidden z-50">
                <div className="p-2">
                  {aiModels.map((model) => {
                    const Icon = modelIcons[model.id] || Zap;
                    return (
                      <button key={model.id} onClick={() => { onModelChange(model.id); setShowModelSelector(false); }} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors', selectedModel === model.id ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-[#424242] text-gray-300')}>
                        <Icon className="h-5 w-5" />
                        <div className="flex-1"><div className="font-medium text-sm">{model.name}</div><div className="text-xs text-gray-500">{model.description}</div></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Shared Toggle - Only visible to Admins */}
          {isAdmin && (
            <button
              onClick={() => setIsSharedUpload(!isSharedUpload)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border",
                isSharedUpload
                  ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                  : "bg-[#2f2f2f] text-gray-400 border-transparent hover:bg-[#3a3a3a]"
              )}
              title={isSharedUpload ? "Mode: Upload to Company Knowledge Base" : "Mode: Private Documents Only"}
            >
              {isSharedUpload ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              <span className="hidden sm:inline">{isSharedUpload ? "Company Data" : "Private Upload"}</span>
            </button>
          )}
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map(att => (
              <div key={att.id} className="relative group flex items-center gap-2 px-3 py-2 bg-[#2f2f2f] rounded-xl border border-[#424242]">
                {att.type === 'image' ? (
                  <>
                    <img src={att.preview} alt={att.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex flex-col"><span className="text-sm text-white truncate max-w-[120px]">{att.name}</span><span className="text-xs text-gray-500">{formatFileSize(att.size)}</span></div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-lg bg-[#424242] flex items-center justify-center"><FileText className="h-5 w-5 text-gray-400" /></div>
                    <div className="flex flex-col">
                      <span className="text-sm text-white truncate max-w-[120px]" title={att.name}>{att.name}</span>
                      <span className="text-xs text-gray-500">{formatFileSize(att.size)}</span>
                      {att.isLoading && <span className="text-[10px] text-yellow-500 animate-pulse">Processing RAG...</span>}
                      {att.isIndexed && <span className="text-[10px] text-emerald-400">{att.content.includes('Shared') ? 'Shared KB ✓' : 'Private KB ✓'}</span>}
                      {att.isError && <span className="text-[10px] text-red-400">Failed</span>}
                    </div>
                  </>
                )}
                <button onClick={() => removeAttachment(att.id)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3 text-white" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Main Input */}
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-end bg-[#2f2f2f] rounded-2xl border border-[#424242] focus-within:border-emerald-500/50 transition-all shadow-lg">
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md,.docx,.xlsx,.xls,.csv" onChange={(e) => handleFileSelect(e, 'file')} className="hidden" />
            <input ref={imageInputRef} type="file" multiple accept="image/*" onChange={(e) => handleFileSelect(e, 'image')} className="hidden" />

            <div className="flex items-center pl-3 pb-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#424242] rounded-xl transition-colors"
                title="Upload File"
                disabled={isLoading}
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#424242] rounded-xl transition-colors"
                title="Upload Image"
                disabled={isLoading}
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onOpenPromptLibrary}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#424242] rounded-xl transition-colors"
                title="Prompt Library"
                disabled={isLoading}
              >
                <BookOpen className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={toggleRecording}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  isRecording
                    ? "text-red-500 bg-red-500/10 animate-pulse"
                    : "text-gray-400 hover:text-white hover:bg-[#424242]"
                )}
                title={isRecording ? "Stop Recording" : "Voice Input"}
                disabled={isLoading}
              >
                {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex-1 relative">
              {activeProject && activeProjectName && !hasActiveConversation && !message && attachments.length === 0 && (
                <div className="absolute left-0 top-4 flex items-center gap-2 text-gray-400 pointer-events-none">
                  <FolderOpen className="h-4 w-4" />
                  <span className="text-sm">New chat in <span className="text-emerald-400">{activeProjectName}</span></span>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={(!activeProject || hasActiveConversation) ? "Message ChatHDI..." : ""}
                rows={1}
                className="w-full bg-transparent text-white placeholder-gray-500 py-4 pr-2 resize-none outline-none max-h-[200px] scrollbar-thin scrollbar-thumb-[#565869]"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center gap-1 p-3">
              {isLoading ? (
                <button type="button" onClick={onStop} className="p-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-white transition-colors"><StopCircle className="h-5 w-5" /></button>
              ) : (
                <button type="submit" disabled={(!message.trim() && attachments.length === 0) || attachments.some(a => a.isLoading)} className={cn('p-2.5 rounded-xl transition-all duration-200', ((message.trim() || attachments.length > 0) && !attachments.some(a => a.isLoading)) ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg' : 'bg-[#424242] text-gray-500 cursor-not-allowed')}>
                  <Send className={cn("h-5 w-5", attachments.some(a => a.isLoading) && "animate-pulse")} />
                </button>
              )}
            </div>
          </div>
        </form>
        <p className="text-xs text-gray-500 text-center mt-3">ChatHDI can make mistakes. Consider checking important information.</p>
      </div>
    </div>
  );
};

export default ChatInput;
