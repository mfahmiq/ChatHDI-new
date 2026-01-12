import React from 'react';
import { Send, Paperclip, Image, Mic, StopCircle, Globe, Sparkles, ChevronDown, Zap, Code, Eye, Brain, FolderOpen, X, FileText, File, Palette } from 'lucide-react';
import { cn } from '../lib/utils';
import { aiModels } from '../data/mockData';
import config from '../config';

const ChatInput = ({
  onSend,
  isLoading,
  onStop,
  selectedModel,
  onModelChange,
  activeProject,
  activeProjectName,
  hasActiveConversation
}) => {
  const [message, setMessage] = React.useState('');
  const [showModelSelector, setShowModelSelector] = React.useState(false);
  const [attachments, setAttachments] = React.useState([]);
  const textareaRef = React.useRef(null);
  const modelSelectorRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const imageInputRef = React.useRef(null);

  React.useEffect(() => {
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
            return `[File: ${att.name}]`;
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
        // Convert image to base64 for preview
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
        // Upload file to backend for parsing
        // No nested loop needed, we are already iterating 'file' from outer loop

        const formData = new FormData();
        formData.append('file', file);

        // Add a temporary loading attachment
        const tempId = Date.now() + Math.random();
        setAttachments(prev => [...prev, {
          id: tempId,
          type: 'file',
          name: file.name,
          size: file.size,
          content: 'Loading...',
          isLoading: true,
          file: file
        }]);

        try {
          const response = await fetch(`${config.API_URL}/upload-document`, {
            method: 'POST',
            body: formData
          });
          const data = await response.json();

          // Update attachment with actual content
          setAttachments(prev => prev.map(att => {
            if (att.id === tempId) {
              return {
                ...att,
                content: data.success ? data.content : `[Error parsing file: ${data.error}]`,
                isLoading: false
              };
            }
            return att;
          }));
        } catch (error) {
          console.error('File upload error:', error);
          setAttachments(prev => prev.map(att => {
            if (att.id === tempId) {
              return {
                ...att,
                content: `[Error uploading file: ${error.message}]`,
                isLoading: false
              };
            }
            return att;
          }));
        }

      }
    }

    // Reset input
    e.target.value = '';
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
    'hdi-4': Zap,
    'hdi-4-mini': Sparkles,
    'hdi-grok': Brain,
    'hdi-grok-mini': Sparkles,
    'hdi-vision': Eye,
    'hdi-code': Code,
    'hdi-image': Palette,
    'hdi-image-flux': Palette
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
                      <button
                        key={model.id}
                        onClick={() => {
                          onModelChange(model.id);
                          setShowModelSelector(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                          selectedModel === model.id
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'hover:bg-[#424242] text-gray-300'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{model.name}</div>
                          <div className="text-xs text-gray-500">{model.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#2f2f2f] rounded-lg text-sm text-gray-400 transition-colors">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#2f2f2f] rounded-lg text-sm text-gray-400 transition-colors">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Thinking</span>
          </button>
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map(att => (
              <div
                key={att.id}
                className="relative group flex items-center gap-2 px-3 py-2 bg-[#2f2f2f] rounded-xl border border-[#424242]"
              >
                {att.type === 'image' ? (
                  <>
                    <img
                      src={att.preview}
                      alt={att.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-white truncate max-w-[120px]">{att.name}</span>
                      <span className="text-xs text-gray-500">{formatFileSize(att.size)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-lg bg-[#424242] flex items-center justify-center">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-white truncate max-w-[120px]">{att.name}</span>
                      <span className="text-xs text-gray-500">{formatFileSize(att.size)}</span>
                    </div>
                  </>
                )}
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-end bg-[#2f2f2f] rounded-2xl border border-[#424242] focus-within:border-emerald-500/50 transition-all shadow-lg">
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.json,.csv,.py,.js,.html,.css,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => handleFileSelect(e, 'file')}
              className="hidden"
            />
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'image')}
              className="hidden"
            />

            {/* Left actions */}
            <div className="flex items-center pl-3 pb-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#424242] rounded-lg transition-colors"
                title="Lampirkan file"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#424242] rounded-lg transition-colors"
                title="Upload gambar"
              >
                <Image className="h-5 w-5" />
              </button>
            </div>

            {/* Textarea with dynamic placeholder */}
            <div className="flex-1 relative">
              {/* Project indicator inside input */}
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
                placeholder={(!activeProject || hasActiveConversation) ? "Tanyakan apa saja ke ChatHDI..." : ""}
                rows={1}
                className="w-full bg-transparent text-white placeholder-gray-500 py-4 pr-2 resize-none outline-none max-h-[200px] scrollbar-thin scrollbar-thumb-[#565869]"
                disabled={isLoading}
              />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 p-3">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-white hover:bg-[#424242] rounded-lg transition-colors"
                title="Voice input"
              >
                <Mic className="h-5 w-5" />
              </button>

              {isLoading ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="p-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-white transition-colors"
                  title="Berhenti"
                >
                  <StopCircle className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!message.trim() && attachments.length === 0}
                  className={cn(
                    'p-2.5 rounded-xl transition-all duration-200',
                    (message.trim() || attachments.length > 0)
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/30'
                      : 'bg-[#424242] text-gray-500 cursor-not-allowed'
                  )}
                  title="Kirim pesan"
                >
                  <Send className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 text-center mt-3">
          ChatHDI dapat membuat kesalahan. Periksa informasi penting.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
