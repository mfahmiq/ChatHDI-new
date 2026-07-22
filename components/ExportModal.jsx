import React, { useState } from 'react';
import { X, FileText, File, Download, Loader2 } from 'lucide-react';

function ExportModal({ isOpen, onClose, onExport, content, isLoading }) {
    const [title, setTitle] = useState('');
    const [format, setFormat] = useState('pdf');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        onExport({
            title: title.trim(),
            format,
            content
        });
    };

    const handleClose = () => {
        setTitle('');
        setFormat('pdf');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md shadow-2xl border border-[#2f2f2f]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#2f2f2f]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                            <Download className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Export Dokumen</h2>
                            <p className="text-sm text-gray-400">Export ke Word atau PDF</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white hover:bg-[#2f2f2f] p-2 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Title Input */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                            <FileText className="w-4 h-4" />
                            Judul Dokumen
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Masukkan judul dokumen..."
                            className="w-full bg-[#2a2a2a] border border-[#3f3f3f] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Format Selection */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                            <File className="w-4 h-4" />
                            Format File
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormat('pdf')}
                                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${format === 'pdf'
                                        ? 'border-red-500 bg-red-500/10 text-red-400'
                                        : 'border-[#3f3f3f] bg-[#2a2a2a] text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-xs font-bold text-red-400">PDF</span>
                                </div>
                                <span className="font-medium">PDF</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormat('docx')}
                                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${format === 'docx'
                                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                        : 'border-[#3f3f3f] bg-[#2a2a2a] text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-xs font-bold text-blue-400">DOC</span>
                                </div>
                                <span className="font-medium">Word</span>
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    {content && (
                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                                Preview Konten
                            </label>
                            <div className="bg-[#2a2a2a] border border-[#3f3f3f] rounded-xl p-3 max-h-32 overflow-y-auto">
                                <p className="text-sm text-gray-400 line-clamp-5 whitespace-pre-wrap">
                                    {content.substring(0, 300)}{content.length > 300 ? '...' : ''}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 py-3 px-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !title.trim()}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Export {format.toUpperCase()}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ExportModal;
