import React, { useState } from 'react';
import { X, Presentation, FileText, Hash, Loader2 } from 'lucide-react';

const PPTGeneratorModal = ({ isOpen, onClose, onGenerate, isLoading }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [slideCount, setSlideCount] = useState(8);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        onGenerate({
            title: title.trim(),
            description: description.trim(),
            slideCount: parseInt(slideCount) || 8
        });
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setSlideCount(8);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2f2f2f] w-full max-w-lg shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#2f2f2f]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                            <Presentation className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Generate Presentasi</h2>
                            <p className="text-sm text-gray-400">Buat file PowerPoint dengan AI</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                            <FileText className="h-4 w-4 text-orange-400" />
                            Judul Presentasi
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Contoh: Strategi Bisnis 2024"
                            className="w-full px-4 py-3 bg-[#2f2f2f] border border-[#424242] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                            <FileText className="h-4 w-4 text-orange-400" />
                            Deskripsi / Poin Utama
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Jelaskan secara singkat apa yang ingin dibahas dalam presentasi ini..."
                            rows={3}
                            className="w-full px-4 py-3 bg-[#2f2f2f] border border-[#424242] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
                        />
                    </div>

                    {/* Slide Count */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                            <Hash className="h-4 w-4 text-orange-400" />
                            Jumlah Slide
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="3"
                                max="20"
                                value={slideCount}
                                onChange={(e) => setSlideCount(e.target.value)}
                                className="flex-1 h-2 bg-[#424242] rounded-full appearance-none cursor-pointer accent-orange-500"
                            />
                            <span className="w-12 text-center px-3 py-2 bg-[#2f2f2f] rounded-lg text-white font-medium">
                                {slideCount}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] rounded-xl text-gray-300 font-medium transition-colors"
                            disabled={isLoading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || isLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Presentation className="h-5 w-5" />
                                    Generate PPT
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PPTGeneratorModal;
