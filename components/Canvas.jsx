'use client';

import React from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Code,
  Copy,
  Download,
  File,
  FileCode2,
  FolderOpen,
  Loader2,
  Maximize2,
  MessageSquare,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  Redo,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Undo,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import config from '../config';

const LANGUAGE_BY_EXTENSION = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  json: 'json',
  md: 'markdown',
  py: 'python',
  sql: 'sql',
  sh: 'bash',
  bash: 'bash',
  txt: 'text',
};

const PREVIEWABLE_EXTENSIONS = new Set([
  'html',
  'htm',
  'css',
  'js',
  'jsx',
  'ts',
  'tsx',
]);

const cloneFiles = files => files.map(file => ({ ...file }));

const getFolderPaths = files => {
  const folders = new Set();

  files.forEach(file => {
    const parts = normalizePath(file.path).split('/');
    parts.pop();
    parts.forEach((_, index) => {
      folders.add(parts.slice(0, index + 1).join('/'));
    });
  });

  return [...folders];
};

const normalizePath = value => {
  const parts = String(value || '')
    .replace(/\\/g, '/')
    .split('/');
  const normalized = [];

  parts.forEach(part => {
    if (!part || part === '.') return;
    if (part === '..') {
      normalized.pop();
      return;
    }
    normalized.push(part);
  });

  return normalized.join('/');
};

const getExtension = filename =>
  normalizePath(filename).split('.').pop()?.toLowerCase() || '';

const getLanguageFromFilename = filename =>
  LANGUAGE_BY_EXTENSION[getExtension(filename)] || 'text';

const looksLikeJsx = content =>
  /return\s*\(\s*</m.test(content) ||
  /<[A-Z][A-Za-z0-9]*(?:\s|\/?>)/m.test(content) ||
  /React\.createElement|from\s+['"]react['"]/m.test(content);

const inferDefaultFilename = (content, language) => {
  const normalizedLanguage = String(language || 'text').toLowerCase();
  const defaultFilenames = {
    html: 'index.html',
    htm: 'index.html',
    css: 'styles.css',
    scss: 'styles.scss',
    javascript: looksLikeJsx(content) ? 'App.jsx' : 'app.js',
    js: looksLikeJsx(content) ? 'App.jsx' : 'app.js',
    jsx: 'App.jsx',
    typescript: looksLikeJsx(content) ? 'App.tsx' : 'index.ts',
    ts: looksLikeJsx(content) ? 'App.tsx' : 'index.ts',
    tsx: 'App.tsx',
    python: 'main.py',
    py: 'main.py',
    json: 'data.json',
    sql: 'query.sql',
    bash: 'script.sh',
    sh: 'script.sh',
    markdown: 'README.md',
    md: 'README.md',
    text: 'notes.txt',
  };

  return defaultFilenames[normalizedLanguage] || 'notes.txt';
};

const createFile = (path, content, index = 0) => {
  const normalizedPath = normalizePath(path) || `file-${index + 1}.txt`;
  return {
    id: `canvas-file-${Date.now()}-${index}-${normalizedPath}`,
    name: normalizedPath.split('/').pop(),
    path: normalizedPath,
    content: content || '',
    language: getLanguageFromFilename(normalizedPath),
  };
};

export const parseCodeToFiles = (codeContent, language) => {
  const source = codeContent || '';
  const markerRegex =
    /^\s*(?:\/\/|#|<!--|\/\*)\s*(?:file(?:name)?|path)\s*:\s*([^\n]+?)(?:\s*-->|\s*\*\/)?\s*$/gim;
  const markers = [...source.matchAll(markerRegex)];

  if (markers.length > 0) {
    const parsed = markers
      .map((marker, index) => {
        const rawPath = marker[1]
          .replace(/(?:-->|\\*\/)\s*$/g, '')
          .replace(/^['"`]|['"`]$/g, '')
          .trim();
        const start = marker.index + marker[0].length;
        const end = markers[index + 1]?.index ?? source.length;
        const content = source
          .slice(start, end)
          .replace(/^\s*\r?\n/, '')
          .replace(/\s+$/, '');
        return rawPath ? createFile(rawPath, content, index) : null;
      })
      .filter(Boolean);

    if (parsed.length > 0) {
      const projectFiles = new Map();
      parsed.forEach(file => {
        const existing = projectFiles.get(file.path);
        if (!existing || file.content.trim() || !existing.content.trim()) {
          projectFiles.set(file.path, file);
        }
      });
      return [...projectFiles.values()];
    }
  }

  const filename = inferDefaultFilename(source, language);
  return [createFile(filename, source, 0)];
};

const serializeFilesToMarkdown = files =>
  files
    .map(file => `### ${file.path}\n\n\`\`\`${file.language}\n${file.content}\n\`\`\``)
    .join('\n\n');

const getNewFileStarter = filename => {
  const language = getLanguageFromFilename(filename);
  if (language === 'html') return `<!-- ${filename} -->\n`;
  if (['python', 'bash'].includes(language)) return `# ${filename}\n`;
  if (language === 'json') return '{\n  \n}\n';
  if (language === 'text' || language === 'markdown') return '';
  return `// ${filename}\n`;
};

const extractAiFileUpdates = (responseText, activeFile) => {
  const updates = [];
  const codeBlockRegex = /```([\w.+-]*)\s*\r?\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(responseText)) !== null) {
    const content = match[2].replace(/\s+$/, '');
    const filenameMatch = content.match(
      /^\s*(?:\/\/|#|<!--|\/\*)\s*(?:file(?:name)?|path)\s*:\s*([^\n]+?)(?:\s*-->|\s*\*\/)?\s*$/im
    );
    const fallbackPath = activeFile?.path;
    const filename = filenameMatch
      ? normalizePath(
          filenameMatch[1]
            .replace(/(?:-->|\\*\/)\s*$/g, '')
            .replace(/^['"`]|['"`]$/g, '')
            .trim()
        )
      : fallbackPath;
    const cleanContent = filenameMatch
      ? content.replace(filenameMatch[0], '').replace(/^\s*\r?\n/, '')
      : content;

    if (filename && cleanContent.trim()) {
      updates.push({ filename, content: cleanContent });
    }
  }

  const deduplicated = new Map();
  updates.forEach(update => deduplicated.set(update.filename, update));
  return [...deduplicated.values()];
};

const applyFileUpdates = (currentFiles, updates) => {
  const nextFiles = cloneFiles(currentFiles);

  updates.forEach(({ filename, content }, index) => {
    const normalizedFilename = normalizePath(filename);
    const existingIndex = nextFiles.findIndex(
      file => file.path === normalizedFilename || file.name === normalizedFilename
    );

    if (existingIndex >= 0) {
      nextFiles[existingIndex] = {
        ...nextFiles[existingIndex],
        content,
        language: getLanguageFromFilename(nextFiles[existingIndex].path),
      };
    } else {
      nextFiles.push(createFile(normalizedFilename, content, currentFiles.length + index));
    }
  });

  return nextFiles;
};

const resolveLocalImport = (importerPath, specifier, availablePaths) => {
  const directoryParts = normalizePath(importerPath).split('/');
  directoryParts.pop();
  const basePath = normalizePath([...directoryParts, specifier].join('/'));
  const candidates = [
    basePath,
    ...['js', 'jsx', 'ts', 'tsx'].map(extension => `${basePath}.${extension}`),
    ...['js', 'jsx', 'ts', 'tsx'].map(extension => `${basePath}/index.${extension}`),
  ];
  return candidates.find(candidate => availablePaths.has(candidate)) || null;
};

const rewriteLocalImports = (source, importerPath, availablePaths) => {
  let rewritten = source.replace(
    /\bimport\s+['"](\.{1,2}\/[^'"]+\.css)['"]\s*;?/g,
    ''
  );

  rewritten = rewritten.replace(
    /((?:\bfrom\s+|\bimport\s*\(\s*)['"])(\.{1,2}\/[^'"]+)(['"])/g,
    (fullMatch, prefix, specifier, suffix) => {
      const resolved = resolveLocalImport(importerPath, specifier, availablePaths);
      return resolved ? `${prefix}canvas:${resolved}${suffix}` : fullMatch;
    }
  );

  rewritten = rewritten.replace(
    /(\bimport\s+['"])(\.{1,2}\/[^'"]+)(['"]\s*;?)/g,
    (fullMatch, prefix, specifier, suffix) => {
      const resolved = resolveLocalImport(importerPath, specifier, availablePaths);
      return resolved ? `${prefix}canvas:${resolved}${suffix}` : fullMatch;
    }
  );

  return rewritten;
};

const extractExternalSpecifiers = source => {
  const specifiers = new Set();
  const patterns = [
    /(?:\bfrom\s+|\bimport\s*\(\s*)['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const specifier = match[1];
      if (
        !specifier.startsWith('.') &&
        !specifier.startsWith('/') &&
        !specifier.startsWith('canvas:') &&
        !/^https?:/.test(specifier)
      ) {
        specifiers.add(specifier);
      }
    }
  });

  return specifiers;
};

const injectBeforeClosingTag = (html, tagName, content) => {
  const closingTag = `</${tagName}>`;
  if (html.toLowerCase().includes(closingTag)) {
    const index = html.toLowerCase().lastIndexOf(closingTag);
    return `${html.slice(0, index)}${content}\n${html.slice(index)}`;
  }
  return `${html}\n${content}`;
};

const stripLocalAssetTags = html =>
  html
    .replace(
      /<script\b[^>]*\bsrc\s*=\s*["'](?:\/|\.{1,2}\/)[^"']+\.(?:js|jsx|ts|tsx)(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi,
      ''
    )
    .replace(
      /<link\b(?=[^>]*\brel\s*=\s*["']stylesheet["'])(?=[^>]*\bhref\s*=\s*["'](?:\/|\.{1,2}\/)[^"']+\.css(?:\?[^"']*)?["'])[^>]*>/gi,
      ''
    );

const getExternalModuleUrl = specifier => {
  const encodedSpecifier = encodeURI(specifier);

  if (specifier === 'react') {
    return 'https://esm.sh/react@19.0.0';
  }
  if (specifier === 'react/jsx-runtime') {
    return 'https://esm.sh/react@19.0.0/jsx-runtime';
  }
  if (specifier === 'react/jsx-dev-runtime') {
    return 'https://esm.sh/react@19.0.0/jsx-dev-runtime';
  }
  if (specifier === 'react-dom') {
    return 'https://esm.sh/react-dom@19.0.0?external=react';
  }
  if (specifier === 'react-dom/client') {
    return 'https://esm.sh/react-dom@19.0.0/client?external=react,react-dom';
  }

  const separator = encodedSpecifier.includes('?') ? '&' : '?';
  return `https://esm.sh/${encodedSpecifier}${separator}bundle&external=react,react-dom`;
};

const createPreviewDocument = (files, Babel) => {
  const htmlFile = files.find(file => ['html', 'htm'].includes(getExtension(file.path)));
  const cssContent = files
    .filter(file => getExtension(file.path) === 'css')
    .map(file => `/* ${file.path} */\n${file.content}`)
    .join('\n\n')
    .replace(/<\/style/gi, '<\\/style');
  const scriptFiles = files.filter(file =>
    ['js', 'jsx', 'ts', 'tsx'].includes(getExtension(file.path))
  );

  let documentHtml = stripLocalAssetTags(htmlFile?.content || `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Canvas Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`);

  if (cssContent) {
    documentHtml = injectBeforeClosingTag(
      documentHtml,
      'head',
      `<style>${cssContent}</style>`
    );
  }

  const availablePaths = new Set(scriptFiles.map(file => normalizePath(file.path)));
  const compiledModules = {};
  const externalSpecifiers = new Set();

  scriptFiles.forEach(file => {
    const path = normalizePath(file.path);
    const extension = getExtension(path);
    const rewrittenSource = rewriteLocalImports(file.content, path, availablePaths);
    extractExternalSpecifiers(rewrittenSource).forEach(specifier =>
      externalSpecifiers.add(specifier)
    );

    const presets = [
      ['env', { modules: false, targets: { esmodules: true } }],
      ['react', { runtime: 'automatic' }],
    ];
    if (extension === 'ts' || extension === 'tsx') presets.push('typescript');

    const transformed = Babel.transform(rewrittenSource, {
      filename: path,
      presets,
      sourceType: 'module',
    }).code;
    compiledModules[`canvas:${path}`] =
      `data:text/javascript;charset=utf-8,${encodeURIComponent(transformed)}`;
  });

  const imports = {
    react: getExternalModuleUrl('react'),
    'react/jsx-runtime': getExternalModuleUrl('react/jsx-runtime'),
    'react/jsx-dev-runtime': getExternalModuleUrl('react/jsx-dev-runtime'),
    'react-dom': getExternalModuleUrl('react-dom'),
    'react-dom/client': getExternalModuleUrl('react-dom/client'),
    ...compiledModules,
  };
  externalSpecifiers.forEach(specifier => {
    imports[specifier] = getExternalModuleUrl(specifier);
  });

  const entryFile =
    scriptFiles.find(file =>
      /(^|\/)(main|index|app)\.(js|jsx|ts|tsx)$/i.test(file.path)
    ) || scriptFiles[0];
  const usesReact = scriptFiles.some(
    file =>
      /(?:from\s+['"]react(?:\/[^'"]*)?['"]|from\s+['"]react-dom(?:\/[^'"]*)?['"]|React\.|ReactDOM\.)/m.test(
        file.content
      ) || looksLikeJsx(file.content)
  );

  const importMap = JSON.stringify({ imports }).replace(/</g, '\\u003c');
  const entrySpecifier = entryFile ? `canvas:${normalizePath(entryFile.path)}` : null;
  const runtimeScript = `
<script type="importmap">${importMap}</script>
<script type="module">
  const report = (type, message = '') => {
    parent.postMessage({ source: 'chathdi-canvas', type, message }, '*');
  };
  window.addEventListener('error', event => {
    report('preview-error', event.message || 'Runtime error');
  });
  window.addEventListener('unhandledrejection', event => {
    report('preview-error', event.reason?.message || String(event.reason || 'Promise rejected'));
  });

  try {
    ${
      entrySpecifier
        ? `const module = await import(${JSON.stringify(entrySpecifier)});
    ${
      usesReact
        ? `const ReactModule = await import('react');
    const React = ReactModule.default || ReactModule;
    const { createRoot } = await import('react-dom/client');
    const App = module.default || Object.values(module).find(value => typeof value === 'function');
    if (typeof App === 'function') {
      let rootElement = document.getElementById('root');
      if (!rootElement) {
        rootElement = document.createElement('div');
        rootElement.id = 'root';
        document.body.appendChild(rootElement);
      }
      createRoot(rootElement).render(React.createElement(App));
    }`
        : ''
    }`
        : ''
    }
    report('preview-ready');
  } catch (error) {
    console.error(error);
    report('preview-error', error?.message || String(error));
  }
</script>`;

  return injectBeforeClosingTag(documentHtml, 'body', runtimeScript);
};

const Canvas = ({
  isOpen,
  onClose,
  code,
  language,
  onUpdate,
  model = 'hdi-nvidia-phi',
}) => {
  const [files, setFiles] = React.useState([]);
  const [activeFileId, setActiveFileId] = React.useState(null);
  const [expandedFolders, setExpandedFolders] = React.useState(['src', 'public']);
  const [fileHistory, setFileHistory] = React.useState([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [copied, setCopied] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('code');
  const [showFileTree, setShowFileTree] = React.useState(true);
  const [previewDocument, setPreviewDocument] = React.useState('');
  const [previewError, setPreviewError] = React.useState('');
  const [previewStatus, setPreviewStatus] = React.useState('idle');
  const [previewKey, setPreviewKey] = React.useState(0);
  const [showNewFileInput, setShowNewFileInput] = React.useState(false);
  const [newFileName, setNewFileName] = React.useState('');
  const [fileError, setFileError] = React.useState('');
  const [chatMessages, setChatMessages] = React.useState([]);
  const [chatInput, setChatInput] = React.useState('');
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [showChat, setShowChat] = React.useState(true);
  const [isDownloadingProject, setIsDownloadingProject] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);
  const [applied, setApplied] = React.useState(false);

  const chatEndRef = React.useRef(null);
  const editorRef = React.useRef(null);
  const lineNumbersRef = React.useRef(null);
  const iframeRef = React.useRef(null);
  const historyTimerRef = React.useRef(null);
  const historyIndexRef = React.useRef(-1);
  const filesRef = React.useRef([]);
  const previewBuildRef = React.useRef(0);

  const activeFile = files.find(file => file.id === activeFileId);
  const localCode = activeFile?.content || '';
  const lineNumbers = Array.from(
    { length: Math.max(1, localCode.split('\n').length) },
    (_, index) => index + 1
  ).join('\n');

  React.useEffect(() => {
    filesRef.current = files;
  }, [files]);

  React.useEffect(() => {
    if (!isOpen) return;
    const parsedFiles = parseCodeToFiles(code, language);
    const snapshot = cloneFiles(parsedFiles);
    setFiles(snapshot);
    filesRef.current = snapshot;
    setFileHistory([cloneFiles(snapshot)]);
    setHistoryIndex(0);
    historyIndexRef.current = 0;
    setActiveFileId(snapshot[0]?.id || null);
    setExpandedFolders(getFolderPaths(snapshot));
    setShowFileTree(true);
    setActiveTab('code');
    setPreviewError('');
    setPreviewStatus('idle');
    setChatMessages([]);
    setApplied(false);
  }, [code, isOpen, language]);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading]);

  React.useEffect(
    () => () => {
      if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    },
    []
  );

  React.useEffect(() => {
    const handlePreviewMessage = event => {
      if (
        event.source !== iframeRef.current?.contentWindow ||
        event.data?.source !== 'chathdi-canvas'
      ) {
        return;
      }
      if (event.data.type === 'preview-ready') {
        setPreviewStatus('ready');
        setPreviewError('');
      }
      if (event.data.type === 'preview-error') {
        setPreviewStatus('error');
        setPreviewError(event.data.message || 'Preview gagal dijalankan.');
      }
    };

    window.addEventListener('message', handlePreviewMessage);
    return () => window.removeEventListener('message', handlePreviewMessage);
  }, []);

  const pushToHistory = React.useCallback(nextFiles => {
    const snapshot = cloneFiles(nextFiles);
    setFileHistory(previousHistory => {
      const nextHistory = [
        ...previousHistory.slice(0, historyIndexRef.current + 1),
        snapshot,
      ].slice(-60);
      const nextIndex = nextHistory.length - 1;
      historyIndexRef.current = nextIndex;
      setHistoryIndex(nextIndex);
      return nextHistory;
    });
  }, []);

  const setFilesAndRecord = React.useCallback(
    nextFiles => {
      const snapshot = cloneFiles(nextFiles);
      setFiles(snapshot);
      filesRef.current = snapshot;
      pushToHistory(snapshot);
      setExpandedFolders(previous => [
        ...new Set([...previous, ...getFolderPaths(snapshot)]),
      ]);
      setApplied(false);
    },
    [pushToHistory]
  );

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    const nextIndex = historyIndexRef.current - 1;
    const snapshot = cloneFiles(fileHistory[nextIndex]);
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    setFiles(snapshot);
    filesRef.current = snapshot;
    if (!snapshot.some(file => file.id === activeFileId)) {
      setActiveFileId(snapshot[0]?.id || null);
    }
    setApplied(false);
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= fileHistory.length - 1) return;
    const nextIndex = historyIndexRef.current + 1;
    const snapshot = cloneFiles(fileHistory[nextIndex]);
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    setFiles(snapshot);
    filesRef.current = snapshot;
    if (!snapshot.some(file => file.id === activeFileId)) {
      setActiveFileId(snapshot[0]?.id || null);
    }
    setApplied(false);
  };

  const updateFileContent = content => {
    const nextFiles = filesRef.current.map(file =>
      file.id === activeFileId ? { ...file, content } : file
    );
    setFiles(nextFiles);
    filesRef.current = nextFiles;
    setApplied(false);

    if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    historyTimerRef.current = setTimeout(() => {
      pushToHistory(filesRef.current);
    }, 600);
  };

  const addNewFile = filename => {
    const normalizedFilename = normalizePath(filename);
    if (!normalizedFilename) {
      setFileError('Masukkan nama file yang valid.');
      return;
    }
    if (filesRef.current.some(file => file.path === normalizedFilename)) {
      setFileError('Nama file tersebut sudah digunakan.');
      return;
    }

    const newFile = createFile(
      normalizedFilename,
      getNewFileStarter(normalizedFilename),
      filesRef.current.length
    );
    const nextFiles = [...filesRef.current, newFile];
    setFilesAndRecord(nextFiles);
    setActiveFileId(newFile.id);
    setShowNewFileInput(false);
    setNewFileName('');
    setFileError('');
  };

  const deleteFile = fileId => {
    const nextFiles = filesRef.current.filter(file => file.id !== fileId);
    setFilesAndRecord(nextFiles);
    if (activeFileId === fileId) {
      setActiveFileId(nextFiles[0]?.id || null);
    }
  };

  const refreshPreview = React.useCallback(async () => {
    const previewFiles = filesRef.current;
    const hasPreviewableFile = previewFiles.some(file =>
      PREVIEWABLE_EXTENSIONS.has(getExtension(file.path))
    );
    if (!hasPreviewableFile) {
      setPreviewStatus('error');
      setPreviewError(
        'Preview tersedia untuk HTML, CSS, JavaScript, JSX, TypeScript, dan TSX.'
      );
      return;
    }

    const buildId = previewBuildRef.current + 1;
    previewBuildRef.current = buildId;
    setPreviewStatus('loading');
    setPreviewError('');

    try {
      const babelModule = await import('@babel/standalone');
      const Babel = babelModule.default || babelModule;
      const nextDocument = createPreviewDocument(previewFiles, Babel);
      if (previewBuildRef.current !== buildId) return;
      setPreviewDocument(nextDocument);
      setPreviewKey(previous => previous + 1);
    } catch (error) {
      if (previewBuildRef.current !== buildId) return;
      console.error('Canvas preview build error:', error);
      setPreviewStatus('error');
      setPreviewError(error.message || 'Kode gagal dikompilasi.');
    }
  }, []);

  React.useEffect(() => {
    if (activeTab !== 'preview') return undefined;
    const timeout = setTimeout(() => {
      refreshPreview();
    }, 300);
    return () => clearTimeout(timeout);
  }, [activeTab, files, refreshPreview]);

  const handleEditorKeyDown = event => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const textarea = event.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const indentation = '  ';
      updateFileContent(
        `${localCode.slice(0, start)}${indentation}${localCode.slice(end)}`
      );
      requestAnimationFrame(() => {
        textarea.selectionStart = start + indentation.length;
        textarea.selectionEnd = start + indentation.length;
      });
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      handleApplyChanges();
    }
  };

  const handleEditorScroll = event => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = event.currentTarget.scrollTop;
    }
  };

  const handleSendAiMessage = async () => {
    if (!chatInput.trim() || isAiLoading || filesRef.current.length === 0) return;

    const userMessage = chatInput.trim();
    const previousConversation = chatMessages
      .filter(message => message.role === 'user' || message.role === 'assistant')
      .slice(-4);
    setChatInput('');
    setChatMessages(previous => [
      ...previous,
      { id: crypto.randomUUID(), role: 'user', content: userMessage },
    ]);
    setIsAiLoading(true);

    try {
      const filesContext = filesRef.current
        .map(file => `=== ${file.path} ===\n${file.content}`)
        .join('\n\n');
      const systemPrompt = `Kamu adalah AI coding assistant di dalam Canvas.
Modifikasi file berdasarkan permintaan pengguna.

FILE SAAT INI:
${filesContext}

ATURAN OUTPUT:
- Untuk setiap file yang diubah, tulis SELURUH isi file dalam code block terpisah.
- Baris pertama setiap code block wajib berupa komentar "filename: path/file.ext".
- Pertahankan seluruh file sebagai satu proyek yang konsisten dan dapat dijalankan.
- Jika membuat aplikasi baru, lengkapi entry point, package.json, konfigurasi, komponen, dan stylesheet yang dibutuhkan.
- Gunakan import relatif yang sesuai dengan struktur folder dan jangan memberi placeholder.
- Jangan mengubah file yang tidak diperlukan.

Contoh:
\`\`\`typescript
// filename: src/App.tsx
[seluruh isi file]
\`\`\``;

      const { supabase } = await import('../supabaseClient');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const responseLanguage =
        window.localStorage.getItem('chathdi.responseLanguage') === 'en' ? 'en' : 'id';
      const selectedModel = model?.includes('image') ? 'hdi-nvidia-phi' : model;
      const response = await fetch(`${config.API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...previousConversation.map(message => ({
              role: message.role,
              content: message.content,
            })),
            { role: 'user', content: userMessage },
          ],
          model: selectedModel || 'hdi-nvidia-phi',
          language: responseLanguage,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.response || `AI request gagal (HTTP ${response.status}).`);
      }

      const aiResponse = data.response || '';
      const currentActiveFile = filesRef.current.find(file => file.id === activeFileId);
      const updates = extractAiFileUpdates(aiResponse, currentActiveFile);

      if (updates.length > 0) {
        const nextFiles = applyFileUpdates(filesRef.current, updates);
        setFilesAndRecord(nextFiles);
        const firstUpdatedFile = nextFiles.find(
          file => file.path === normalizePath(updates[0].filename)
        );
        if (firstUpdatedFile) setActiveFileId(firstUpdatedFile.id);
        setChatMessages(previous => [
          ...previous,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `✅ ${updates.length} file diperbarui: ${updates
              .map(update => update.filename)
              .join(', ')}`,
          },
        ]);
      } else {
        setChatMessages(previous => [
          ...previous,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              aiResponse ||
              'AI tidak mengembalikan perubahan file. Coba jelaskan perubahan secara lebih spesifik.',
          },
        ]);
      }
    } catch (error) {
      console.error('Canvas AI error:', error);
      setChatMessages(previous => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ ${error.message}`,
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(localCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Canvas copy error:', error);
    }
  };

  const downloadBlob = (content, filename, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    if (activeFile) downloadBlob(activeFile.content, activeFile.name);
  };

  const handleDownloadAll = async () => {
    if (isDownloadingProject || filesRef.current.length === 0) return;
    setIsDownloadingProject(true);

    try {
      const { default: JSZip } = await import('jszip');
      const archive = new JSZip();
      filesRef.current.forEach(file => {
        archive.file(normalizePath(file.path), file.content);
      });
      const blob = await archive.generateAsync({ type: 'blob' });
      downloadBlob(blob, 'chathdi-canvas-project.zip', 'application/zip');
    } catch (error) {
      console.error('Canvas project download error:', error);
      setChatMessages(previous => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ Proyek gagal diunduh: ${error.message}`,
        },
      ]);
    } finally {
      setIsDownloadingProject(false);
    }
  };

  async function handleApplyChanges() {
    if (!onUpdate || filesRef.current.length === 0 || isApplying) return;
    if (historyTimerRef.current) {
      clearTimeout(historyTimerRef.current);
      historyTimerRef.current = null;
      pushToHistory(filesRef.current);
    }

    setIsApplying(true);
    try {
      await onUpdate(cloneFiles(filesRef.current), {
        markdown: serializeFilesToMarkdown(filesRef.current),
      });
      setApplied(true);
    } catch (error) {
      console.error('Canvas apply error:', error);
      setChatMessages(previous => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ Perubahan gagal diterapkan: ${error.message}`,
        },
      ]);
    } finally {
      setIsApplying(false);
    }
  }

  const buildFileTree = () => {
    const tree = {};
    files.forEach(file => {
      const parts = normalizePath(file.path).split('/');
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

  const renderFileTree = (tree, depth = 0, parentPath = '') =>
    Object.entries(tree)
      .sort(([nameA, itemA], [nameB, itemB]) => {
        if (itemA.type !== itemB.type) return itemA.type === 'folder' ? -1 : 1;
        return nameA.localeCompare(nameB);
      })
      .map(([name, item]) => {
      const nodePath = parentPath ? `${parentPath}/${name}` : name;
      if (item.type === 'folder') {
        const isExpanded = expandedFolders.includes(nodePath);
        return (
          <div key={nodePath}>
            <button
              type="button"
              onClick={() =>
                setExpandedFolders(previous =>
                  isExpanded
                    ? previous.filter(folder => folder !== nodePath)
                    : [...previous, nodePath]
                )
              }
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-300 hover:bg-[#2f2f2f]"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <FolderOpen className="h-4 w-4 text-yellow-500" />
              <span className="truncate">{name}</span>
            </button>
            {isExpanded &&
              renderFileTree(item.children, depth + 1, nodePath)}
          </div>
        );
      }

      return (
        <div
          key={item.id}
          className={cn(
            'group flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-[#2f2f2f]',
            activeFileId === item.id
              ? 'bg-[#2f2f2f] text-white'
              : 'text-gray-400'
          )}
          style={{ paddingLeft: `${depth * 12 + 20}px` }}
          onClick={() => setActiveFileId(item.id)}
          role="button"
          tabIndex={0}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              setActiveFileId(item.id);
            }
          }}
        >
          <File className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">{name}</span>
          <button
            type="button"
            onClick={event => {
              event.stopPropagation();
              deleteFile(item.id);
            }}
            className="rounded p-1 opacity-0 hover:bg-red-500/20 group-hover:opacity-100"
            aria-label={`Hapus ${name}`}
          >
            <Trash2 className="h-3 w-3 text-red-400" />
          </button>
        </div>
      );
      });

  if (!isOpen) return null;

  return (
    <section
      className={cn(
        'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[#2f2f2f] bg-[#0d0d0d] shadow-2xl transition-all duration-300',
        isFullscreen ? 'w-full' : 'md:w-[780px] lg:w-[min(1050px,calc(100vw-280px))]'
      )}
      aria-label="Canvas editor"
    >
      <header className="flex items-center justify-between border-b border-[#2f2f2f] bg-[#171717] px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Code className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white">Canvas</h3>
            <p className="text-xs text-gray-500">
              {files.length} file{files.length === 1 ? '' : 's'}
              {activeFile ? ` · ${activeFile.path}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <IconButton
            label="Undo"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            icon={Undo}
          />
          <IconButton
            label="Redo"
            onClick={handleRedo}
            disabled={historyIndex >= fileHistory.length - 1}
            icon={Redo}
          />
          <div className="mx-1 h-6 w-px bg-[#2f2f2f]" />
          <IconButton
            label="AI Assistant"
            onClick={() => setShowChat(previous => !previous)}
            icon={MessageSquare}
            active={showChat}
          />
          <IconButton
            label={isFullscreen ? 'Keluar dari layar penuh' : 'Layar penuh'}
            onClick={() => setIsFullscreen(previous => !previous)}
            icon={isFullscreen ? Minimize2 : Maximize2}
          />
          <IconButton label="Tutup Canvas" onClick={onClose} icon={X} />
        </div>
      </header>

      <div className="flex items-center gap-1 border-b border-[#2f2f2f] bg-[#171717] px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={() => setShowFileTree(previous => !previous)}
          className={cn(
            'mr-1 rounded-lg p-2 transition-colors',
            showFileTree
              ? 'bg-[#303030] text-white'
              : 'text-gray-400 hover:bg-[#2f2f2f] hover:text-white'
          )}
          aria-label={showFileTree ? 'Sembunyikan file tree' : 'Tampilkan file tree'}
          aria-pressed={showFileTree}
        >
          {showFileTree ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
        <TabButton
          active={activeTab === 'code'}
          onClick={() => setActiveTab('code')}
          icon={FileCode2}
          label="Code"
        />
        <TabButton
          active={activeTab === 'preview'}
          onClick={() => setActiveTab('preview')}
          icon={Play}
          label="Preview"
        />
        {activeTab === 'preview' && (
          <button
            type="button"
            onClick={refreshPreview}
            className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-[#2f2f2f] hover:text-white"
            aria-label="Muat ulang preview"
          >
            <RefreshCw
              className={cn('h-4 w-4', previewStatus === 'loading' && 'animate-spin')}
            />
          </button>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {showFileTree && (
          <button
            type="button"
            className="absolute inset-0 z-20 bg-black/50 sm:hidden"
            onClick={() => setShowFileTree(false)}
            aria-label="Tutup file tree"
          />
        )}
        {showFileTree && (
        <aside className="absolute inset-y-0 left-0 z-30 flex w-60 shrink-0 flex-col border-r border-[#2f2f2f] bg-[#171717] shadow-xl sm:static sm:z-auto sm:w-56 sm:shadow-none">
          <div className="flex items-center justify-between border-b border-[#2f2f2f] px-3 py-2">
            <div className="min-w-0">
              <span className="block text-xs font-semibold uppercase text-gray-500">
                Project files
              </span>
              <span className="block truncate text-[11px] text-gray-600">
                {files.length} file dalam satu workspace
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowNewFileInput(true);
                setFileError('');
              }}
              className="rounded p-1 text-gray-400 hover:bg-[#2f2f2f] hover:text-white"
              aria-label="Tambah file"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {showNewFileInput && (
            <div className="border-b border-[#2f2f2f] p-2">
              <input
                type="text"
                value={newFileName}
                onChange={event => {
                  setNewFileName(event.target.value);
                  setFileError('');
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter') addNewFile(newFileName);
                  if (event.key === 'Escape') {
                    setShowNewFileInput(false);
                    setFileError('');
                  }
                }}
                placeholder="filename.ext"
                className="w-full rounded bg-[#2f2f2f] px-2 py-1 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
              {fileError && <p className="mt-1 text-[11px] text-red-400">{fileError}</p>}
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-2">
            {files.length > 0 ? (
              renderFileTree(buildFileTree())
            ) : (
              <p className="px-3 py-4 text-center text-xs text-gray-500">
                Belum ada file
              </p>
            )}
          </div>
        </aside>
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {activeTab === 'code' ? (
            <>
              <div className="flex shrink-0 items-center gap-2 border-b border-[#2f2f2f] bg-[#1a1a1a] px-3 py-2 sm:px-4">
                <File className="h-4 w-4 text-gray-400" />
                <span className="truncate text-sm text-white">
                  {activeFile?.path || 'Tidak ada file aktif'}
                </span>
                {activeFile && (
                  <span className="rounded bg-[#2f2f2f] px-2 py-0.5 text-xs text-gray-500">
                    {activeFile.language}
                  </span>
                )}
              </div>

              <div className="flex min-h-0 flex-1 bg-[#0d0d0d]">
                <pre
                  ref={lineNumbersRef}
                  className="w-12 select-none overflow-hidden border-r border-[#242424] px-2 py-4 text-right font-mono text-sm leading-6 text-gray-600"
                  aria-hidden="true"
                >
                  {lineNumbers}
                </pre>
                <textarea
                  ref={editorRef}
                  value={localCode}
                  onChange={event => updateFileContent(event.target.value)}
                  onKeyDown={handleEditorKeyDown}
                  onScroll={handleEditorScroll}
                  className="min-w-0 flex-1 resize-none bg-[#0d0d0d] p-4 font-mono text-sm leading-6 text-gray-200 outline-none"
                  spellCheck={false}
                  placeholder={activeFile ? '// Tulis kode di sini...' : 'Tambahkan file terlebih dahulu.'}
                  disabled={!activeFile}
                  aria-label="Editor kode"
                />
              </div>
            </>
          ) : (
            <div className="relative min-h-0 flex-1 bg-white">
              {previewDocument && (
                <iframe
                  ref={iframeRef}
                  key={previewKey}
                  srcDoc={previewDocument}
                  sandbox="allow-scripts allow-modals"
                  className="h-full w-full border-0 bg-white"
                  title="Code Preview"
                />
              )}

              {previewStatus === 'loading' && (
                <PreviewOverlay>
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-purple-500" />
                  <p className="font-medium text-gray-800">Mengompilasi preview...</p>
                </PreviewOverlay>
              )}

              {previewStatus === 'error' && (
                <PreviewOverlay>
                  <AlertCircle className="mb-3 h-10 w-10 text-red-500" />
                  <p className="font-medium text-red-600">Preview gagal dijalankan</p>
                  <p className="mt-2 max-w-md text-center text-sm text-gray-600">
                    {previewError}
                  </p>
                  <button
                    type="button"
                    onClick={refreshPreview}
                    className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
                  >
                    Coba lagi
                  </button>
                </PreviewOverlay>
              )}
            </div>
          )}
        </main>

        {showChat && (
          <aside className="absolute inset-0 z-20 flex w-full shrink-0 flex-col border-l border-[#2f2f2f] bg-[#171717] md:static md:w-80">
            <div className="flex items-center justify-between border-b border-[#2f2f2f] px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">AI Assistant</span>
              </div>
              <button
                type="button"
                onClick={() => setShowChat(false)}
                className="rounded p-1 text-gray-400 hover:bg-[#2f2f2f] hover:text-white md:hidden"
                aria-label="Tutup AI Assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {chatMessages.length === 0 ? (
                <div className="py-8 text-center">
                  <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                  <p className="text-sm text-gray-400">Minta AI mengedit file Canvas</p>
                  <p className="mt-2 text-xs leading-5 text-gray-600">
                    Contoh: “Perbaiki error TypeScript” atau “Tambahkan dark mode”.
                  </p>
                </div>
              ) : (
                chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={cn(
                      'rounded-lg p-3 text-sm leading-5',
                      message.role === 'user'
                        ? 'ml-4 bg-purple-500/20 text-purple-100'
                        : 'mr-4 bg-[#2f2f2f] text-gray-300'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                ))
              )}

              {isAiLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI membaca file dan menyiapkan perubahan...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-[#2f2f2f] p-3">
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={chatInput}
                  onChange={event => setChatInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSendAiMessage();
                    }
                  }}
                  placeholder="Edit kode dengan AI..."
                  className="min-h-[42px] flex-1 resize-none rounded-lg bg-[#2f2f2f] px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500"
                  disabled={isAiLoading}
                  aria-label="Instruksi untuk AI"
                />
                <button
                  type="button"
                  onClick={handleSendAiMessage}
                  disabled={isAiLoading || !chatInput.trim()}
                  className="rounded-lg bg-purple-500 p-2.5 text-white transition-colors hover:bg-purple-400 disabled:cursor-not-allowed disabled:bg-gray-600"
                  aria-label="Kirim instruksi AI"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-[#2f2f2f] bg-[#171717] px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <FooterButton
            onClick={handleCopy}
            icon={copied ? Check : Copy}
            label={copied ? 'Tersalin' : 'Salin'}
            disabled={!activeFile}
          />
          <FooterButton
            onClick={handleDownload}
            icon={Download}
            label="Unduh file"
            disabled={!activeFile}
          />
          {files.length > 1 && (
            <FooterButton
              onClick={handleDownloadAll}
              icon={isDownloadingProject ? Loader2 : Download}
              label={isDownloadingProject ? 'Membuat ZIP...' : 'Unduh proyek ZIP'}
              disabled={isDownloadingProject}
            />
          )}
        </div>

        <button
          type="button"
          onClick={handleApplyChanges}
          disabled={!onUpdate || files.length === 0 || isApplying}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
        >
          {isApplying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : applied ? (
            <Check className="h-4 w-4" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>{applied ? 'Diterapkan' : 'Terapkan ke chat'}</span>
        </button>
      </footer>
    </section>
  );
};

const IconButton = ({
  label,
  onClick,
  icon: Icon,
  disabled = false,
  active = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className={cn(
      'rounded-lg p-2 text-gray-400 transition-colors hover:bg-[#2f2f2f] hover:text-white disabled:cursor-not-allowed disabled:opacity-30',
      active && 'bg-purple-500/20 text-purple-400'
    )}
  >
    <Icon className="h-5 w-5" />
  </button>
);

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
      active ? 'bg-[#2f2f2f] text-white' : 'text-gray-400 hover:text-white'
    )}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

const FooterButton = ({ onClick, icon: Icon, label, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-2 rounded-lg bg-[#2f2f2f] px-2.5 py-2 text-sm text-gray-300 transition-colors hover:bg-[#3a3a3a] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
    title={label}
  >
    <Icon className="h-4 w-4" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const PreviewOverlay = ({ children }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6">
    {children}
  </div>
);

export default Canvas;
