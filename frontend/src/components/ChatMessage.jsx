import React from 'react';
import { User, Copy, Check, RefreshCw, ThumbsUp, ThumbsDown, Share, Bookmark, MoreHorizontal, Sparkles, Download, Play, Image as ImageIcon, Film, FileText, FolderOpen } from 'lucide-react';
import { cn } from '../lib/utils';

const ChatMessage = ({ message, onRegenerate, isLast, onOpenCanvas }) => {
  const [copied, setCopied] = React.useState(false);
  const [liked, setLiked] = React.useState(null);
  const isUser = message.role === 'user';

  // Extract all code blocks from message content
  const extractAllCodeBlocks = (content) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'code';
      const code = match[2];

      // Try to detect filename from code comments
      const filenameMatch = code.match(/^\/\/\s*(\S+\.\w+)|^#\s*(\S+\.\w+)|^<!--\s*(\S+\.\w+)/);
      let filename = filenameMatch ? (filenameMatch[1] || filenameMatch[2] || filenameMatch[3]) : null;

      // Generate filename based on language if not found
      if (!filename) {
        const langFileMap = {
          html: 'index.html', htm: 'index.html',
          css: 'styles.css', scss: 'styles.scss',
          javascript: 'app.js', js: 'app.js',
          jsx: 'App.jsx', tsx: 'App.tsx',
          typescript: 'index.ts', ts: 'index.ts',
          python: 'main.py', py: 'main.py',
          json: 'data.json', sql: 'query.sql',
          bash: 'script.sh', sh: 'script.sh'
        };
        const baseName = langFileMap[language.toLowerCase()] || `code-${blocks.length + 1}.txt`;
        filename = baseName;
      }

      blocks.push({
        language,
        code,
        filename
      });
    }

    return blocks;
  };

  // Get all code blocks in this message
  const allCodeBlocks = React.useMemo(() => {
    if (!message.content) return [];
    return extractAllCodeBlocks(message.content);
  }, [message.content]);

  // Handle opening all code blocks in Canvas
  const handleOpenAllInCanvas = () => {
    if (allCodeBlocks.length === 0 || !onOpenCanvas) return;

    // Create combined content with file markers
    const combinedCode = allCodeBlocks.map(block =>
      `// filename: ${block.filename}\n${block.code}`
    ).join('\n\n');

    // Send to Canvas with first language as reference
    onOpenCanvas(combinedCode, allCodeBlocks[0].language);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadMedia = (base64Data, mediaType, index) => {
    let mimeType, extension, filename;

    if (mediaType === 'image') {
      mimeType = 'image/png';
      extension = 'png';
      filename = `chathdi_image_${Date.now()}_${index}.${extension}`;
    } else if (mediaType === 'video') {
      mimeType = 'video/mp4';
      extension = 'mp4';
      filename = `chathdi_video_${Date.now()}_${index}.${extension}`;
    } else if (mediaType === 'pptx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      extension = 'pptx';
      filename = message.filename || `ChatHDI_Presentation_${Date.now()}.pptx`;
    }

    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMedia = () => {
    if (!message.mediaType || !message.mediaData || message.mediaData.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 space-y-4">
        {message.mediaData.map((data, index) => (
          <div key={index} className="relative group/media">
            {message.mediaType === 'image' ? (
              <div className="relative rounded-xl overflow-hidden border border-[#2f2f2f] max-w-lg">
                <img
                  src={`data:image/png;base64,${data}`}
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-auto"
                />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/media:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownloadMedia(data, 'image', index)}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
                    title="Download gambar"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/50 rounded-lg">
                  <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs text-white">Nano Banana</span>
                </div>
              </div>
            ) : message.mediaType === 'pptx' ? (
              <div className="relative rounded-xl overflow-hidden border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-4 max-w-md">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{message.filename || 'Presentation.pptx'}</p>
                    <p className="text-sm text-gray-400">PowerPoint Presentation</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadMedia(data, 'pptx', index)}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 rounded-xl text-white font-medium transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download PPTX
                </button>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-[#2f2f2f] max-w-lg">
                <video
                  src={`data:video/mp4;base64,${data}`}
                  controls
                  className="w-full h-auto"
                />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/media:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownloadMedia(data, 'video', index)}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
                    title="Download video"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/50 rounded-lg">
                  <Film className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-xs text-white">Veo 3.0</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderContent = (content) => {
    const parts = content.split(/(```[\s\S]*?```)/);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const lines = part.slice(3, -3).split('\n');
        const language = lines[0] || 'code';
        const code = lines.slice(1).join('\n');

        return (
          <div key={index} className="my-4 rounded-xl overflow-hidden bg-[#0d0d0d] border border-[#2f2f2f]">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1a] border-b border-[#2f2f2f]">
              <span className="text-xs text-gray-400 font-medium">{language}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenCanvas && onOpenCanvas(code, language)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Open in Canvas
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Salin
                </button>
              </div>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code className="text-gray-200 font-mono">{code}</code>
            </pre>
          </div>
        );
      }

      return (
        <div key={index} className="whitespace-pre-wrap">
          {part.split('\n').map((line, lineIndex) => {
            let processedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>');
            processedLine = processedLine.replace(/`([^`]+)`/g, '<code class="bg-[#2f2f2f] text-emerald-400 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

            if (line.startsWith('- ') || line.startsWith('• ')) {
              return (
                <div key={lineIndex} className="flex gap-2 my-1 ml-2">
                  <span className="text-emerald-500">•</span>
                  <span dangerouslySetInnerHTML={{ __html: processedLine.slice(2) }} />
                </div>
              );
            }

            const numberedMatch = line.match(/^(\d+)\.\s/);
            if (numberedMatch) {
              return (
                <div key={lineIndex} className="flex gap-2 my-1 ml-2">
                  <span className="text-emerald-500 font-medium">{numberedMatch[1]}.</span>
                  <span dangerouslySetInnerHTML={{ __html: processedLine.slice(numberedMatch[0].length) }} />
                </div>
              );
            }

            // Headers
            if (line.startsWith('**') && line.endsWith('**')) {
              return (
                <h3 key={lineIndex} className="text-white font-semibold mt-4 mb-2">
                  {line.slice(2, -2)}
                </h3>
              );
            }

            return (
              <p
                key={lineIndex}
                className={line.trim() === '' ? 'h-3' : 'leading-relaxed'}
                dangerouslySetInnerHTML={{ __html: processedLine }}
              />
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className={cn(
      'group py-6 transition-colors',
      isUser ? 'bg-transparent' : 'bg-[#171717]'
    )}>
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className={cn(
            'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg',
            isUser
              ? 'bg-gradient-to-br from-purple-500 to-pink-500'
              : 'bg-gradient-to-br from-emerald-500 to-cyan-500'
          )}>
            {isUser ? (
              <User className="h-5 w-5 text-white" />
            ) : (
              <img src="/logo-hdi.png" alt="HDI" className="h-6 w-6 object-contain" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-white">
                {isUser ? 'Anda' : 'ChatHDI'}
              </span>
              {!isUser && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                  {message.mediaType === 'image' ? 'Nano Banana' : message.mediaType === 'video' ? 'Veo 3.0' : 'HDI-4'}
                </span>
              )}
            </div>

            {/* Render user attachments */}
            {isUser && message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments.map((att, idx) => (
                  <div key={idx} className="relative">
                    {att.type === 'image' ? (
                      <img
                        src={att.preview}
                        alt={att.name}
                        className="max-w-xs max-h-48 rounded-lg border border-[#2f2f2f]"
                      />
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#2f2f2f] rounded-lg">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-300">{att.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="text-gray-300 leading-relaxed">
              {renderContent(message.content)}
            </div>

            {/* Open All in Canvas button - appears when there are multiple code blocks */}
            {!isUser && allCodeBlocks.length > 1 && (
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={handleOpenAllInCanvas}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm font-medium transition-colors"
                >
                  <FolderOpen className="h-4 w-4" />
                  Open All {allCodeBlocks.length} Files in Canvas
                </button>
                <span className="text-xs text-gray-500">
                  {allCodeBlocks.map(b => b.filename).join(', ')}
                </span>
              </div>
            )}

            {/* Render generated media */}
            {renderMedia()}

            {/* Action buttons */}
            {!isUser && (
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-[#2f2f2f]/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors text-xs"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Tersalin!' : 'Salin'}
                </button>
                {isLast && onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors text-xs"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </button>
                )}
                <button
                  onClick={() => setLiked(liked === 'up' ? null : 'up')}
                  className={cn(
                    'p-1.5 hover:bg-[#2f2f2f] rounded-lg transition-colors',
                    liked === 'up' ? 'text-emerald-500' : 'text-gray-400 hover:text-white'
                  )}
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setLiked(liked === 'down' ? null : 'down')}
                  className={cn(
                    'p-1.5 hover:bg-[#2f2f2f] rounded-lg transition-colors',
                    liked === 'down' ? 'text-red-500' : 'text-gray-400 hover:text-white'
                  )}
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
                <div className="flex-1" />
                <button className="p-1.5 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors">
                  <Bookmark className="h-4 w-4" />
                </button>
                <button className="p-1.5 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors">
                  <Share className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
