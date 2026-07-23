import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Copy, Check, RefreshCw, ThumbsUp, ThumbsDown, Share, Bookmark, MoreHorizontal, Sparkles, Download, Play, Image as ImageIcon, Film, FileText, FolderOpen, StopCircle, Table, Pencil, Save, X } from 'lucide-react';
import { cn } from '../lib/utils';

const normalizeProjectPath = value => {
  const normalized = [];
  String(value || '')
    .replace(/\\/g, '/')
    .split('/')
    .forEach(part => {
      if (!part || part === '.') return;
      if (part === '..') {
        normalized.pop();
        return;
      }
      normalized.push(part);
    });
  return normalized.join('/');
};

const PROJECT_PATH_PATTERN =
  /((?:[A-Za-z0-9_.@-]+\/)*[A-Za-z0-9_.@-]+\.[A-Za-z0-9]+)(?=$|[\s`*):,])/;

const extractProjectPath = value => {
  const match = String(value || '').replace(/["']/g, '').match(PROJECT_PATH_PATTERN);
  return match ? normalizeProjectPath(match[1]) : '';
};

const getExplicitBlockPath = (code, fenceInfo, precedingContent) => {
  const metadataMatch = String(fenceInfo || '').match(
    /(?:file(?:name)?|path)\s*=\s*["']?([^"'\s]+)["']?/i
  );
  if (metadataMatch) return normalizeProjectPath(metadataMatch[1]);

  const firstLines = String(code || '').split(/\r?\n/).slice(0, 6);
  for (const line of firstLines) {
    const labeledMatch = line.match(
      /^\s*(?:\/\/|#|<!--|\/\*)\s*(?:file(?:name)?|path)\s*:\s*(.+?)(?:\s*-->|\s*\*\/)?\s*$/i
    );
    if (labeledMatch) {
      const path = extractProjectPath(labeledMatch[1]);
      if (path) return path;
    }

    const commentMatch = line.match(
      /^\s*(?:\/\/|#|<!--|\/\*)\s*((?:[A-Za-z0-9_.@-]+\/)*[A-Za-z0-9_.@-]+\.[A-Za-z0-9]+)(?:\s*-->|\s*\*\/)?\s*$/
    );
    if (commentMatch) return normalizeProjectPath(commentMatch[1]);
  }

  const nearbyLines = String(precedingContent || '').split(/\r?\n/).slice(-6).reverse();
  for (const line of nearbyLines) {
    if (!/^\s*(?:#{1,6}\s+|[-*]\s+|\*\*|file(?:name)?\s*:|path\s*:)/i.test(line)) {
      continue;
    }
    const path = extractProjectPath(line);
    if (path) return path;
  }

  return '';
};

const getScriptExtension = language => {
  const normalized = String(language || '').toLowerCase();
  if (normalized === 'tsx' || normalized === 'typescriptreact') return 'tsx';
  if (normalized === 'ts' || normalized === 'typescript') return 'ts';
  if (normalized === 'jsx' || normalized === 'javascriptreact') return 'jsx';
  return 'js';
};

const createUniqueProjectPath = (desiredPath, usedPaths) => {
  const normalized = normalizeProjectPath(desiredPath) || 'code.txt';
  if (!usedPaths.has(normalized)) {
    usedPaths.add(normalized);
    return normalized;
  }

  const dotIndex = normalized.lastIndexOf('.');
  const base = dotIndex > normalized.lastIndexOf('/')
    ? normalized.slice(0, dotIndex)
    : normalized;
  const extension = dotIndex > normalized.lastIndexOf('/')
    ? normalized.slice(dotIndex)
    : '';
  let suffix = 2;
  let candidate = `${base}-${suffix}${extension}`;
  while (usedPaths.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}${extension}`;
  }
  usedPaths.add(candidate);
  return candidate;
};

const inferBlockPath = (block, index, isReactProject) => {
  const language = block.language.toLowerCase();
  const code = block.code;

  if (language === 'html' || language === 'htm') return 'index.html';
  if (language === 'markdown' || language === 'md') return 'README.md';
  if (language === 'json') {
    try {
      const parsed = JSON.parse(code);
      if (parsed?.compilerOptions) return 'tsconfig.json';
      if (parsed?.dependencies || parsed?.devDependencies || parsed?.scripts) {
        return 'package.json';
      }
    } catch {
      // Keep the JSON as a regular project data file when it is incomplete.
    }
    return 'src/data.json';
  }
  if (language === 'css' || language === 'scss') {
    return isReactProject
      ? `src/styles.${language === 'scss' ? 'scss' : 'css'}`
      : `styles.${language === 'scss' ? 'scss' : 'css'}`;
  }
  if (['javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx'].includes(language)) {
    const extension = getScriptExtension(language);
    if (/defineConfig\s*\(|from\s+['"]vite['"]/.test(code)) {
      return `vite.config.${extension === 'ts' || extension === 'tsx' ? 'ts' : 'js'}`;
    }
    if (/createRoot\s*\(|ReactDOM\.render\s*\(/.test(code)) {
      return `src/main.${extension}`;
    }
    if (
      /(?:export\s+default\s+)?function\s+App\b|(?:const|class)\s+App\b|export\s+default\s+App\b/.test(
        code
      )
    ) {
      return `src/App.${extension}`;
    }
    const componentMatch = code.match(
      /export\s+default\s+function\s+([A-Z][A-Za-z0-9_]*)\b/
    );
    if (componentMatch) return `src/components/${componentMatch[1]}.${extension}`;
    return isReactProject ? `src/code-${index + 1}.${extension}` : `app.${extension}`;
  }
  if (language === 'python' || language === 'py') return 'main.py';
  if (language === 'sql') return 'database/query.sql';
  if (['bash', 'sh', 'shell'].includes(language)) return 'scripts/setup.sh';
  return `docs/code-${index + 1}.txt`;
};

const resolveProjectImport = (importerPath, specifier) => {
  const directory = normalizeProjectPath(importerPath).split('/');
  directory.pop();
  return normalizeProjectPath([...directory, specifier].join('/'));
};

const extractAllCodeBlocks = content => {
  const codeBlockRegex = /```([^\r\n]*)\r?\n([\s\S]*?)```/g;
  const blocks = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const fenceInfo = match[1].trim();
    const language =
      fenceInfo.split(/\s+/)[0].replace(/^language-/, '') || 'code';
    const code = match[2].replace(/\s+$/, '');
    blocks.push({
      language,
      code,
      explicitPath: getExplicitBlockPath(
        code,
        fenceInfo,
        content.slice(0, match.index)
      ),
    });
  }

  const isReactProject = blocks.some(block =>
    /(?:from\s+['"]react(?:-dom)?(?:\/[^'"]*)?['"]|createRoot\s*\(|<[A-Z][A-Za-z0-9]*)/.test(
      block.code
    )
  );
  const usedPaths = new Set();

  blocks.forEach((block, index) => {
    if (block.explicitPath) {
      block.filename = block.explicitPath;
      usedPaths.add(block.filename);
      return;
    }
    if (['css', 'scss'].includes(block.language.toLowerCase())) return;
    block.filename = createUniqueProjectPath(
      inferBlockPath(block, index, isReactProject),
      usedPaths
    );
  });

  const importedStylePaths = [];
  blocks.forEach(block => {
    if (!block.filename) return;
    const importPattern = /\bimport\s+['"](\.{1,2}\/[^'"]+\.(?:css|scss))['"]/g;
    let styleMatch;
    while ((styleMatch = importPattern.exec(block.code)) !== null) {
      const resolved = resolveProjectImport(block.filename, styleMatch[1]);
      if (!usedPaths.has(resolved) && !importedStylePaths.includes(resolved)) {
        importedStylePaths.push(resolved);
      }
    }
  });

  blocks.forEach((block, index) => {
    if (block.filename) return;
    const importedPath = importedStylePaths.shift();
    block.filename = createUniqueProjectPath(
      importedPath || inferBlockPath(block, index, isReactProject),
      usedPaths
    );
  });

  const deduplicated = new Map();
  blocks.forEach(block => {
    deduplicated.set(block.filename, {
      language: block.language,
      code: block.code,
      filename: block.filename,
    });
  });
  return [...deduplicated.values()];
};

const ChatMessage = ({ message, modelName, onRegenerate, onResend, onEdit, isLast, onOpenCanvas, onGeneratePPT, onExport, onBookmark, autoSpeak, onSpeakEnd }) => {
  const [copied, setCopied] = React.useState(false);
  const [liked, setLiked] = React.useState(null);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState(message.content);
  const isUser = message.role === 'user';
  const utteranceRef = React.useRef(null);

  // Handle Text-to-Speech
  const handleSpeak = React.useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      if (onSpeakEnd) onSpeakEnd();
    } else {
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.lang = 'id-ID';

      utterance.onend = () => {
        setIsSpeaking(false);
        if (onSpeakEnd) onSpeakEnd();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        if (onSpeakEnd) onSpeakEnd();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  }, [isSpeaking, message.content, onSpeakEnd]);

  // Auto-speak effect
  React.useEffect(() => {
    if (autoSpeak && !isSpeaking) {
      handleSpeak();
    }
  }, [autoSpeak, handleSpeak]);

  // Cleanup speech on unmount
  React.useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  const hasTable = React.useMemo(() => {
    return message.content.includes('|') && message.content.includes('---');
  }, [message.content]);

  const handleExportData = async (format) => {
    try {
      const { parseMarkdownTable, exportToExcel, exportToCSV } = await import('../utils/dataExporter');
      const data = parseMarkdownTable(message.content);

      if (data.length === 0) {
        alert("Tidak ada data tabel yang valid ditemukan.");
        return;
      }

      if (format === 'excel') {
        exportToExcel(data, `ChatHDI_Data_${Date.now()}.xlsx`);
      } else {
        exportToCSV(data, `ChatHDI_Data_${Date.now()}.csv`);
      }
    } catch (error) {
      console.error("Export Data Error:", error);
      alert("Gagal export data.");
    }
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

  const handleSaveEdit = () => {
    const nextContent = editedContent.trim();
    if (!nextContent || !onEdit) return;

    onEdit(message.id, nextContent);
    setIsEditing(false);
  };

  const handleDownloadMedia = (base64Data, mediaType, index) => {
    let mimeType, extension, filename;

    if (mediaType === 'image') {
      mimeType = message.mediaMime || 'image/png';
      extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png';
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
                  src={`data:${message.mediaMime || 'image/png'};base64,${data}`}
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
                  <span className="text-xs text-white">{message.mediaModel || modelName || 'Image Model'}</span>
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
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-3 mt-6 text-2xl font-bold text-white first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-6 text-xl font-semibold text-white first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-5 text-lg font-semibold text-white first:mt-0">{children}</h3>,
          h4: ({ children }) => <h4 className="mb-2 mt-4 font-semibold text-white first:mt-0">{children}</h4>,
          p: ({ children }) => <p className="my-2 whitespace-pre-wrap leading-relaxed first:mt-0 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="text-gray-200">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 underline transition-colors hover:text-emerald-300"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6 marker:text-emerald-500">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6 marker:font-medium marker:text-emerald-500">{children}</ol>,
          li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-emerald-500/60 bg-emerald-500/5 px-4 py-2 text-gray-300">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-5 border-[#3a3a3a]" />,
          table: ({ children }) => (
            <div className="my-4 max-w-full overflow-x-auto rounded-xl border border-[#3a3a3a] bg-[#1b1b1b]">
              <table className="min-w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[#2a2a2a] text-white">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-[#353535]">{children}</tbody>,
          tr: ({ children }) => <tr className="transition-colors even:bg-white/[0.02] hover:bg-white/[0.04]">{children}</tr>,
          th: ({ children }) => (
            <th className="whitespace-nowrap border-r border-[#3a3a3a] px-4 py-3 font-semibold last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="min-w-40 border-r border-[#303030] px-4 py-3 align-top leading-relaxed last:border-r-0">
              {children}
            </td>
          ),
          pre: ({ children }) => {
            const codeElement = React.Children.toArray(children)[0];
            const className = React.isValidElement(codeElement) ? codeElement.props.className || '' : '';
            const code = React.isValidElement(codeElement)
              ? String(codeElement.props.children || '').replace(/\n$/, '')
              : String(children).replace(/\n$/, '');
            const language = className.match(/language-([\w-]+)/)?.[1] || 'code';

            return (
              <div className="my-4 overflow-hidden rounded-xl border border-[#2f2f2f] bg-[#0d0d0d]">
                <div className="flex items-center justify-between border-b border-[#2f2f2f] bg-[#1a1a1a] px-4 py-2.5">
                  <span className="text-xs font-medium text-gray-400">{language}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!onOpenCanvas) return;
                        if (allCodeBlocks.length > 1) {
                          handleOpenAllInCanvas();
                        } else {
                          onOpenCanvas(code, language);
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-emerald-400"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {allCodeBlocks.length > 1
                        ? `Open project (${allCodeBlocks.length} files)`
                        : 'Open in Canvas'}
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(code)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Salin
                    </button>
                  </div>
                </div>
                <pre className="overflow-x-auto p-4 text-sm">
                  <code className="font-mono text-gray-200">{code}</code>
                </pre>
              </div>
            );
          },
          code: ({ className, children }) => (
            <code className={cn('rounded bg-[#2f2f2f] px-1.5 py-0.5 font-mono text-sm text-emerald-400', className)}>
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
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
              <img src="logo-hdi.png" alt="HDI" className="h-6 w-6 object-contain" />
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
                  {message.mediaType === 'image' ? 'Nano Banana' : message.mediaType === 'video' ? 'Veo 3.0' : modelName || 'Chat Model'}
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

            {isUser && isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editedContent}
                  onChange={(event) => setEditedContent(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                      handleSaveEdit();
                    }
                    if (event.key === 'Escape') {
                      setEditedContent(message.content);
                      setIsEditing(false);
                    }
                  }}
                  autoFocus
                  rows={Math.min(8, Math.max(2, editedContent.split('\n').length))}
                  className="w-full resize-y rounded-xl border border-emerald-500/40 bg-[#212121] px-3 py-2 text-gray-200 outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-black hover:bg-emerald-400"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Simpan & kirim
                  </button>
                  <button
                    onClick={() => {
                      setEditedContent(message.content);
                      setIsEditing(false);
                    }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:bg-[#2f2f2f] hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-300 leading-relaxed">
                {renderContent(message.content)}
              </div>
            )}

            {!isUser && message.ragSources?.length > 0 && (
              <div className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                <p className="mb-2 text-xs font-medium text-emerald-400">Sumber knowledge yang digunakan</p>
                <div className="flex flex-wrap gap-2">
                  {message.ragSources.map((source, sourceIndex) => (
                    <span
                      key={`${source.source}-${source.heading}-${sourceIndex}`}
                      className="rounded-full border border-[#3a3a3a] bg-[#212121] px-2.5 py-1 text-xs text-gray-300"
                      title={`Similarity ${(source.similarity * 100).toFixed(1)}% • ${source.storage}`}
                    >
                      {source.source} · {source.heading}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
            {isUser && !isEditing && (
              <div className="mt-3 flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                <button
                  onClick={handleCopy}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#2f2f2f] hover:text-white"
                  title={copied ? 'Tersalin' : 'Salin prompt'}
                  aria-label={copied ? 'Prompt tersalin' : 'Salin prompt'}
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => onResend && onResend(message.id)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#2f2f2f] hover:text-white"
                  title="Kirim ulang prompt"
                  aria-label="Kirim ulang prompt"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setEditedContent(message.content);
                    setIsEditing(true);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#2f2f2f] hover:text-white"
                  title="Edit prompt"
                  aria-label="Edit prompt"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}

            {!isUser && (
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-[#2f2f2f]/50 transition-opacity">
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
                <button
                  onClick={handleSpeak}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isSpeaking
                      ? "text-emerald-500 bg-emerald-500/10"
                      : "text-gray-400 hover:text-white hover:bg-[#2f2f2f]"
                  )}
                  title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                >
                  {isSpeaking ? <StopCircle className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => onBookmark && onBookmark()}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    message.isBookmarked
                      ? "text-yellow-500 hover:text-yellow-400"
                      : "text-gray-400 hover:text-white hover:bg-[#2f2f2f]"
                  )}
                  title={message.isBookmarked ? "Remove Bookmark" : "Bookmark Message"}
                >
                  <Bookmark className={cn("h-4 w-4", message.isBookmarked && "fill-current")} />
                </button>
                {hasTable && (
                  <button
                    onClick={() => handleExportData('excel')}
                    className="p-1.5 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="Export Table to Excel"
                  >
                    <Table className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => onGeneratePPT && onGeneratePPT(message.content)}
                  className="p-1.5 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Generate PPT from this message"
                >
                  <FileText className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onExport && onExport(message.content)}
                  className="p-1.5 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Export to Word/PDF"
                >
                  <Download className="h-4 w-4" />
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
