import React from 'react';
import { X, Copy, Download, Play, RefreshCw, Maximize2, Minimize2, Check, Code, FileCode, AlertCircle, FolderOpen, File, Plus, Trash2, ChevronRight, ChevronDown, FolderPlus, Send, MessageSquare, Loader2, Sparkles, Undo, Redo } from 'lucide-react';
import { cn } from '../lib/utils';
import config from '../config';

// File type icons mapping
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const icons = {
    js: '📜', jsx: '⚛️', ts: '📘', tsx: '⚛️',
    html: '🌐', htm: '🌐', css: '🎨', scss: '🎨',
    json: '📋', md: '📝', py: '🐍', sql: '🗃️',
    sh: '💻', bash: '💻', txt: '📄', env: '🔒'
  };
  return icons[ext] || '📄';
};

// Get language from filename
const getLanguageFromFilename = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const langs = {
    js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
    html: 'html', htm: 'html', css: 'css', scss: 'scss',
    json: 'json', md: 'markdown', py: 'python', sql: 'sql',
    sh: 'bash', bash: 'bash'
  };
  return langs[ext] || 'text';
};

const Canvas = ({ isOpen, onClose, code, language, onUpdate }) => {
  // Multi-file state
  const [files, setFiles] = React.useState([]);
  const [activeFileId, setActiveFileId] = React.useState(null);
  const [expandedFolders, setExpandedFolders] = React.useState(['src', 'public']);

  // History state
  const [fileHistory, setFileHistory] = React.useState([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);

  // Push to history
  const pushToHistory = (newFiles) => {
    const newHistory = fileHistory.slice(0, historyIndex + 1);
    newHistory.push(newFiles);
    setFileHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo/Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setFiles(fileHistory[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < fileHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFiles(fileHistory[newIndex]);
    }
  };

  // UI state
  const [copied, setCopied] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('code');
  const [previewError, setPreviewError] = React.useState(null);
  const [previewKey, setPreviewKey] = React.useState(0);
  const [showNewFileInput, setShowNewFileInput] = React.useState(false);
  const [newFileName, setNewFileName] = React.useState('');

  // AI Chat state
  const [chatMessages, setChatMessages] = React.useState([]);
  const [chatInput, setChatInput] = React.useState('');
  // Image upload disabled for now
  // const [selectedImages, setSelectedImages] = React.useState([]); 
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [showChat, setShowChat] = React.useState(true);
  const chatEndRef = React.useRef(null);

  // Initialize files when code prop changes
  React.useEffect(() => {
    if (code) {
      const parsedFiles = parseCodeToFiles(code, language);
      setFiles(parsedFiles);
      setFileHistory([parsedFiles]);
      setHistoryIndex(0);
      if (parsedFiles.length > 0) {
        setActiveFileId(parsedFiles[0].id);
      }
    }
  }, [code, language]);

  // Auto scroll chat
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Parse code into file structure
  const parseCodeToFiles = (codeContent, lang) => {
    const fileMarkerRegex = /(?:\/\/|#|<!--)\s*(?:file(?:name)?|path):\s*([^\n]+)/gi;
    const matches = [...(codeContent?.matchAll(fileMarkerRegex) || [])];

    if (matches.length > 0) {
      const fileBlocks = codeContent.split(fileMarkerRegex);
      const parsedFiles = [];

      for (let i = 1; i < fileBlocks.length; i += 2) {
        const filename = fileBlocks[i]?.trim();
        const content = fileBlocks[i + 1]?.trim() || '';
        if (filename) {
          parsedFiles.push({
            id: `file-${Date.now()}-${i}`,
            name: filename,
            path: filename,
            content: content,
            language: getLanguageFromFilename(filename)
          });
        }
      }

      if (parsedFiles.length > 0) return parsedFiles;
    }

    const defaultFilenames = {
      html: 'index.html', javascript: 'app.js', js: 'app.js',
      jsx: 'App.jsx', tsx: 'App.tsx', css: 'styles.css',
      python: 'main.py', json: 'data.json', sql: 'query.sql'
    };

    return [{
      id: `file-${Date.now()}`,
      name: defaultFilenames[lang?.toLowerCase()] || 'code.txt',
      path: defaultFilenames[lang?.toLowerCase()] || 'code.txt',
      content: codeContent || '',
      language: lang || 'text'
    }];
  };

  // Get active file
  const activeFile = files.find(f => f.id === activeFileId);
  const localCode = activeFile?.content || '';

  // Update file content
  const updateFileContent = (content) => {
    const newFiles = files.map(f =>
      f.id === activeFileId ? { ...f, content } : f
    );
    setFiles(newFiles);

    // Debounce history push for typing
    const timeoutId = setTimeout(() => {
      pushToHistory(newFiles);
    }, 1000);
    return () => clearTimeout(timeoutId);
  };

  // Add new file
  const addNewFile = (filename) => {
    if (!filename) return;

    const newFile = {
      id: `file-${Date.now()}`,
      name: filename,
      path: filename,
      content: `// ${filename}\n\n`,
      language: getLanguageFromFilename(filename)
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setShowNewFileInput(false);
    setNewFileName('');
  };

  // Delete file
  const deleteFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (activeFileId === fileId && files.length > 1) {
      const remaining = files.filter(f => f.id !== fileId);
      setActiveFileId(remaining[0]?.id);
    }
  };

  // AI Chat - send message to edit code
  const handleSendAiMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);

    try {
      // Create context with all files
      const filesContext = files.map(f =>
        `=== ${f.path} ===\n${f.content}`
      ).join('\n\n');

      const systemPrompt = `Kamu adalah asisten coding AI. User memiliki file-file berikut:

${filesContext}

User ingin kamu memodifikasi kode berdasarkan permintaan mereka.
PENTING: Berikan output dalam format CODE BLOCK untuk SETIAP file yang dimodifikasi:

\`\`\`javascript
// filename: app.js
[isi kode lengkap]
\`\`\`

\`\`\`html
// filename: index.html
[isi kode lengkap]
\`\`\`

Berikan SELURUH isi file yang dimodifikasi dalam code block terpisah.
Gunakan language yang sesuai (javascript, html, css, dll).`;

      const response = await fetch(`${config.API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          model: 'hdi-grok'
        })
      });

      const data = await response.json();
      const aiResponse = data.response || 'Maaf, terjadi kesalahan.';

      setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

      // Parse AI response - try multiple patterns
      let updatedFiles = [];

      // Pattern 1: Code blocks with ``` markers
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let match;

      while ((match = codeBlockRegex.exec(aiResponse)) !== null) {
        const codeContent = match[2];

        // Robust regex to find filename in first few lines
        // Supports: // filename: file.ext, <!-- filename: file.ext -->, /* filename: file.ext */
        const filenameMatch = codeContent.match(/^(?:\/\/|<!--|\/\*)\s*filename:\s*([^\s]+?)(?:\s*-->|\s*\*\/)?$/m);

        if (filenameMatch) {
          const filename = filenameMatch[1].trim();
          // Remove the filename comment line to get clean content
          const newContent = codeContent.replace(/^(?:\/\/|<!--|\/\*)\s*filename:\s*[^\n]+\n?/m, '').trim();
          updatedFiles.push({ filename, content: newContent });
        }
      }

      // Pattern 2: Plain text with filename markers (fallback)
      if (updatedFiles.length === 0) {
        const plainFileRegex = /(?:\/\/|<!--|\/\*)\s*filename:\s*([^\s]+?)(?:\s*-->|\s*\*\/)?\n([\s\S]*?)(?=(?:\/\/|<!--|\/\*)\s*filename:|$)/gi;
        let plainMatch;

        while ((plainMatch = plainFileRegex.exec(aiResponse)) !== null) {
          const filename = plainMatch[1].trim();
          let content = plainMatch[2].trim();

          // Clean up any markdown artifacts
          content = content.replace(/^```\w*\n?/gm, '').replace(/```$/gm, '').trim();

          if (filename && content) {
            updatedFiles.push({ filename, content });
          }
        }
      }

      // Apply updates to files
      if (updatedFiles.length > 0) {
        console.log('Updating files:', updatedFiles.map(f => f.filename));

        setFiles(prevFiles => {
          let newFiles = [...prevFiles];

          updatedFiles.forEach(({ filename, content }) => {
            const existingIndex = newFiles.findIndex(
              f => f.path === filename || f.name === filename
            );

            if (existingIndex >= 0) {
              // Update existing file
              newFiles[existingIndex] = {
                ...newFiles[existingIndex],
                content: content
              };
            } else {
              // Add new file
              newFiles.push({
                id: `file-${Date.now()}-${filename}`,
                name: filename,
                path: filename,
                content: content,
                language: getLanguageFromFilename(filename)
              });
            }
          });

          return newFiles;
        });

        // Push final state to history after AI update
        // We use a timeout to let the state update settle, or use the updater callback result if we could access it directly
        // But since we are inside an async function, we can calculate the new state and push it.
        // Re-calculating newFiles to push to history strictly:
        const currentFilesState = await new Promise(resolve => setFiles(prev => { resolve(prev); return prev; }));

        let newHistoryFiles = [...currentFilesState];
        updatedFiles.forEach(({ filename, content }) => {
          const existingIndex = newHistoryFiles.findIndex(f => f.path === filename || f.name === filename);
          if (existingIndex >= 0) {
            newHistoryFiles[existingIndex] = { ...newHistoryFiles[existingIndex], content };
          } else {
            newHistoryFiles.push({
              id: `file-${Date.now()}-${filename}`,
              name: filename,
              path: filename,
              content: content,
              language: getLanguageFromFilename(filename)
            });
          }
        });
        pushToHistory(newHistoryFiles);

        // Show success message
        setChatMessages(prev => [...prev, {
          role: 'system',
          content: `✅ Updated ${updatedFiles.length} file(s): ${updatedFiles.map(f => f.filename).join(', ')}`
        }]);
      }

    } catch (error) {
      console.error('AI Error:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${error.message}`
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Copy handler
  const handleCopy = async () => {
    await navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download handlers
  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([localCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    const combined = files.map(f =>
      `// filename: ${f.path}\n${f.content}`
    ).join('\n\n---\n\n');

    const blob = new Blob([combined], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-files.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefreshPreview = () => {
    setPreviewError(null);
    setPreviewKey(prev => prev + 1);
  };

  // Generate preview HTML with robust multi-file support
  const generatePreviewHTML = () => {
    // Separate files
    const htmlFile = files.find(f => f.name.endsWith('.html') || f.name.endsWith('.htm'));
    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const jsFiles = files.filter(f => /\.(js|jsx|ts|tsx)$/.test(f.name));

    // Create CSS string
    const cssContent = cssFiles.map(f => f.content).join('\n');

    // Prepare files data for injection
    const filesData = jsFiles.map(f => ({
      name: f.name,
      content: f.content
    }));

    // Base HTML structure
    let baseHtml = htmlFile ? htmlFile.content : `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

    // Inject styles if needed (if not already present)
    if (cssContent && !baseHtml.includes(cssContent)) {
      if (baseHtml.includes('</head>')) {
        baseHtml = baseHtml.replace('</head>', `<style>\n${cssContent}\n</style>\n</head>`);
      } else {
        baseHtml = `<style>${cssContent}</style>` + baseHtml;
      }
    }

    // Inject Babel
    const babelScript = '<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>';
    if (!baseHtml.includes('babel.min.js')) {
      if (baseHtml.includes('<head>')) {
        baseHtml = baseHtml.replace('<head>', '<head>\n' + babelScript);
      } else {
        baseHtml = babelScript + baseHtml;
      }
    }

    // Prepare the script runner
    const scriptRunner = `
    <script>
      window.onerror = function(message, source, lineno, colno, error) {
        // Create an error overlay
        const errDiv = document.createElement('div');
        errDiv.style.cssText = 'position:fixed; top:0; left:0; right:0; padding:20px; background:#fff0f0; border-bottom:2px solid #ffcdd2; color:#d32f2f; z-index:9999; font-family:monospace;';
        errDiv.innerHTML = '<h3>Runtime Error</h3><pre>' + message + '</pre>';
        document.body.appendChild(errDiv);
      };

      const sourceFiles = ${JSON.stringify(filesData)};
      const blobRegistry = {};

      try {
        // 1. Transform and Create Blobs
        sourceFiles.forEach(file => {
          try {
            // Determine filename for extension checks
            const filename = file.name;
            const isTs = filename.endsWith('.ts') || filename.endsWith('.tsx');
            
            // Transform code
            const output = Babel.transform(file.content, { 
              presets: ['react', 'env', ...(isTs ? ['typescript'] : [])], 
              filename: filename 
            }).code;
            
            const blob = new Blob([output], {type: 'text/javascript'});
            const blobUrl = URL.createObjectURL(blob);
            
            blobRegistry['./' + filename] = blobUrl;
            
            // Map without extension
            const nameCheck = filename.replace(/\.[^/.]+$/, "");
            blobRegistry['./' + nameCheck] = blobUrl;
            
          } catch (err) {
            console.error('Transform error for ' + file.name, err);
            const errDiv = document.createElement('div');
            errDiv.style.color = 'orange';
            errDiv.innerText = 'Transform error: ' + file.name + ' - ' + err.message;
            document.body.appendChild(errDiv);
          }
        });

        // 2. Import Map
        const importMap = {
          imports: {
            "react": "https://esm.sh/react@18.2.0",
            "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
            "react-beautiful-dnd": "https://esm.sh/react-beautiful-dnd@13.1.1",
            "lucide-react": "https://esm.sh/lucide-react@0.263.1",
            ...blobRegistry
          }
        };

        const mapEl = document.createElement('script');
        mapEl.type = "importmap";
        mapEl.textContent = JSON.stringify(importMap);
        document.head.appendChild(mapEl);

        // 3. Mount Entry Point
        const entryFile = sourceFiles.find(f => /^(App|index|main)\.(t|j)sx?$/.test(f.name)) || sourceFiles[0];
        
        if (entryFile) {
          const mountScript = document.createElement('script');
          mountScript.type = 'module';
          mountScript.textContent = \`
            import React from 'react';
            import { createRoot } from 'react-dom/client';
            
            try {
              // Import the entry file
              // We use dynamic import to catch errors during module evaluation
              const module = await import('./\${entryFile.name}');
              const App = module.default || module;

              const rootEl = document.getElementById('root') || document.body.appendChild(document.createElement('div'));
              if (!rootEl.id) rootEl.id = 'root';

              // If it exports a React component, render it
              if (typeof App === 'function' || (typeof App === 'object' && App.$$typeof)) {
                const root = createRoot(rootEl);
                root.render(React.createElement(App));
              } 
              // Vanilla JS side effects already ran by the import
            } catch (err) {
              console.error(err);
              throw err;
            }
          \`;
          document.body.appendChild(mountScript);
        }
      } catch (e) {
        console.error(e);
        document.body.insertAdjacentHTML('beforeend', '<div style="color:red">Setup Error: ' + e.message + '</div>');
      }
    </script>`;

    // Inject script runner before body end
    if (baseHtml.includes('</body>')) {
      return baseHtml.replace('</body>', scriptRunner + '\n</body>');
    } else {
      return baseHtml + scriptRunner;
    }
  };

  // Build file tree structure
  const buildFileTree = () => {
    const tree = {};
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = { type: 'file', ...file };
        } else {
          if (!current[part]) current[part] = { type: 'folder', children: {} };
          current = current[part].children;
        }
      });
    });
    return tree;
  };

  // Render file tree
  const renderFileTree = (tree, depth = 0) => {
    return Object.entries(tree).map(([name, item]) => {
      if (item.type === 'folder') {
        const isExpanded = expandedFolders.includes(name);
        return (
          <div key={name}>
            <button
              onClick={() => setExpandedFolders(prev =>
                isExpanded ? prev.filter(f => f !== name) : [...prev, name]
              )}
              className="w-full flex items-center gap-2 px-2 py-1 hover:bg-[#2f2f2f] rounded text-left text-sm text-gray-300"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <FolderOpen className="h-4 w-4 text-yellow-500" />
              <span>{name}</span>
            </button>
            {isExpanded && renderFileTree(item.children, depth + 1)}
          </div>
        );
      }
      return (
        <div
          key={item.id}
          role="button"
          onClick={() => setActiveFileId(item.id)}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1 hover:bg-[#2f2f2f] rounded text-left text-sm group cursor-pointer',
            activeFileId === item.id ? 'bg-[#2f2f2f] text-white' : 'text-gray-400'
          )}
          style={{ paddingLeft: `${depth * 12 + 20}px` }}
        >
          <span>{getFileIcon(name)}</span>
          <span className="flex-1 truncate">{name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); deleteFile(item.id); }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded"
          >
            <Trash2 className="h-3 w-3 text-red-400" />
          </button>
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      'fixed inset-y-0 right-0 z-50 bg-[#0d0d0d] border-l border-[#2f2f2f] flex flex-col transition-all duration-300',
      isFullscreen ? 'w-full' : 'w-full md:w-[750px] lg:w-[900px]'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f2f2f] bg-[#171717]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Code className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Canvas</h3>
            <p className="text-xs text-gray-500">{files.length} file{files.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo className="h-5 w-5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= fileHistory.length - 1}
            className="p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo className="h-5 w-5" />
          </button>
          <div className="w-px h-6 bg-[#2f2f2f] mx-1" />
          <button
            onClick={() => setShowChat(!showChat)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showChat ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-[#2f2f2f] text-gray-400 hover:text-white'
            )}
            title="Toggle AI Chat"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#2f2f2f] bg-[#171717]">
        <button
          onClick={() => setActiveTab('code')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
            activeTab === 'code' ? 'bg-[#2f2f2f] text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          <FileCode className="h-4 w-4" />
          Code
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
            activeTab === 'preview' ? 'bg-[#2f2f2f] text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          <Play className="h-4 w-4" />
          Preview
        </button>
        {activeTab === 'preview' && (
          <button
            onClick={handleRefreshPreview}
            className="ml-auto p-1.5 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        <div className="w-44 border-r border-[#2f2f2f] bg-[#171717] flex flex-col shrink-0">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#2f2f2f]">
            <span className="text-xs text-gray-500 uppercase font-semibold">Files</span>
            <button
              onClick={() => setShowNewFileInput(true)}
              className="p-1 hover:bg-[#2f2f2f] rounded text-gray-400 hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {showNewFileInput && (
            <div className="px-2 py-2 border-b border-[#2f2f2f]">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addNewFile(newFileName);
                  if (e.key === 'Escape') setShowNewFileInput(false);
                }}
                placeholder="filename.ext"
                className="w-full bg-[#2f2f2f] text-white text-sm px-2 py-1 rounded outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-2">
            {renderFileTree(buildFileTree())}
          </div>
        </div>

        {/* Editor / Preview Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'code' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {activeFile && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2f2f2f] bg-[#1a1a1a] shrink-0">
                  <span>{getFileIcon(activeFile.name)}</span>
                  <span className="text-sm text-white">{activeFile.path}</span>
                  <span className="text-xs text-gray-500 px-2 py-0.5 bg-[#2f2f2f] rounded">
                    {activeFile.language}
                  </span>
                </div>
              )}
              <textarea
                value={localCode}
                onChange={(e) => updateFileContent(e.target.value)}
                className="flex-1 w-full bg-[#0d0d0d] text-gray-200 font-mono text-sm p-4 resize-none outline-none"
                spellCheck={false}
                placeholder="// Write your code here..."
              />
            </div>
          ) : (
            <div className="flex-1 relative">
              {previewError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] p-4">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400 mb-2">Preview Error</p>
                    <p className="text-gray-500 text-sm">{previewError}</p>
                  </div>
                </div>
              ) : (
                <iframe
                  key={previewKey}
                  srcDoc={generatePreviewHTML()}
                  sandbox="allow-scripts allow-modals"
                  className="w-full h-full bg-white border-0"
                  title="Code Preview"
                />
              )}
            </div>
          )}
        </div>

        {/* AI Chat Sidebar */}
        {showChat && (
          <div className="w-80 border-l border-[#2f2f2f] bg-[#171717] flex flex-col shrink-0">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2f2f2f]">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">AI Assistant</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Minta AI untuk mengedit kode</p>
                  <p className="text-xs text-gray-600 mt-2">Contoh: "Tambahkan dark mode" atau "Perbaiki bug di fungsi X"</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 rounded-lg text-sm',
                      msg.role === 'user'
                        ? 'bg-purple-500/20 text-purple-100 ml-4'
                        : 'bg-[#2f2f2f] text-gray-300 mr-4'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))
              )}
              {isAiLoading && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI sedang berpikir...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-[#2f2f2f]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendAiMessage()}
                  placeholder="Edit kode dengan AI..."
                  className="flex-1 bg-[#2f2f2f] text-white text-sm px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-purple-500"
                  disabled={isAiLoading}
                />
                <button
                  onClick={handleSendAiMessage}
                  disabled={isAiLoading || !chatInput.trim()}
                  className="p-2 bg-purple-500 hover:bg-purple-400 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#2f2f2f] bg-[#171717]">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#2f2f2f] hover:bg-[#3a3a3a] rounded-lg text-sm text-gray-300 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Tersalin!' : 'Salin'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#2f2f2f] hover:bg-[#3a3a3a] rounded-lg text-sm text-gray-300 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          {files.length > 1 && (
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#2f2f2f] hover:bg-[#3a3a3a] rounded-lg text-sm text-gray-300 transition-colors"
            >
              <FolderPlus className="h-4 w-4" />
              All Files
            </button>
          )}
        </div>
        <button
          onClick={() => onUpdate && onUpdate(files)}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-lg text-sm text-white font-medium transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Apply Changes
        </button>
      </div>
    </div>
  );
};

export default Canvas;
