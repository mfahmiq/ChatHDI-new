import React from 'react';
import { X, Copy, Download, Play, RefreshCw, Maximize2, Minimize2, Check, Code, FileCode } from 'lucide-react';
import { cn } from '../lib/utils';

const Canvas = ({ isOpen, onClose, code, language, onUpdate }) => {
  const [localCode, setLocalCode] = React.useState(code || '');
  const [copied, setCopied] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('code');

  React.useEffect(() => {
    setLocalCode(code || '');
  }, [code]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([localCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      'fixed inset-y-0 right-0 z-50 bg-[#0d0d0d] border-l border-[#2f2f2f] flex flex-col transition-all duration-300',
      isFullscreen ? 'w-full' : 'w-full md:w-[600px] lg:w-[700px]'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f2f2f] bg-[#171717]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Code className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Canvas</h3>
            <p className="text-xs text-gray-500">{language || 'code'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'code' ? (
          <textarea
            value={localCode}
            onChange={(e) => setLocalCode(e.target.value)}
            className="w-full h-full bg-[#0d0d0d] text-gray-200 font-mono text-sm p-4 resize-none outline-none"
            spellCheck={false}
          />
        ) : (
          <div className="w-full h-full bg-white p-4 overflow-auto">
            <div className="text-gray-800 text-sm">
              Preview akan ditampilkan di sini untuk kode HTML/CSS/JS
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
        </div>
        <button
          onClick={() => onUpdate && onUpdate(localCode)}
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
