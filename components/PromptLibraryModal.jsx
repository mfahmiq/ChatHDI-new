import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Command, Search, Star, MessageSquare } from 'lucide-react';

// Default templates
const defaultPrompts = [
    {
        id: 'def-1',
        title: 'Analyze Code',
        content: 'Please analyze the following code for bugs, performance issues, and security vulnerabilities. Providing suggestions for improvement.\n\nCode:',
        tags: 'coding, review'
    },
    {
        id: 'def-2',
        title: 'Explain Like I\'m 5',
        content: 'Explain the following concept like I am 5 years old, using simple analogies:\n\nTopic:',
        tags: 'learning, simple'
    },
    {
        id: 'def-3',
        title: 'Write Email',
        content: 'Write a professional email about [TOPIC] to [RECIPIENT]. The tone should be [TONE].',
        tags: 'writing, productivity'
    }
];

const PromptLibraryModal = ({ isOpen, onClose, onSelectPrompt }) => {
    const [prompts, setPrompts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState({ title: '', content: '', tags: '' });

    useEffect(() => {
        // Load from localStorage
        const saved = localStorage.getItem('hdi_prompt_templates');
        if (saved) {
            setPrompts(JSON.parse(saved));
        } else {
            setPrompts(defaultPrompts);
            localStorage.setItem('hdi_prompt_templates', JSON.stringify(defaultPrompts));
        }
    }, []);

    const handleSave = () => {
        if (!currentPrompt.title || !currentPrompt.content) return;

        let newPrompts;
        if (currentPrompt.id) {
            // Update
            newPrompts = prompts.map(p => p.id === currentPrompt.id ? currentPrompt : p);
        } else {
            // Create
            newPrompts = [...prompts, { ...currentPrompt, id: `custom-${Date.now()}` }];
        }

        setPrompts(newPrompts);
        localStorage.setItem('hdi_prompt_templates', JSON.stringify(newPrompts));
        setIsEditing(false);
        setCurrentPrompt({ title: '', content: '', tags: '' });
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this template?')) {
            const newPrompts = prompts.filter(p => p.id !== id);
            setPrompts(newPrompts);
            localStorage.setItem('hdi_prompt_templates', JSON.stringify(newPrompts));
        }
    };

    const filteredPrompts = prompts.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl border border-[#2f2f2f]">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#2f2f2f]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                            <Command className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Prompt Library</h2>
                            <p className="text-sm text-gray-400">Manage your reusable prompts</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">

                    {isEditing ? (
                        <div className="flex-1 p-6 overflow-y-auto">
                            <h3 className="text-lg font-medium text-white mb-4">{currentPrompt.id ? 'Edit Template' : 'New Template'}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Title</label>
                                    <input
                                        value={currentPrompt.title}
                                        onChange={e => setCurrentPrompt({ ...currentPrompt, title: e.target.value })}
                                        className="w-full bg-[#2a2a2a] border border-[#3f3f3f] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g., Code Review"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Prompt Content</label>
                                    <textarea
                                        value={currentPrompt.content}
                                        onChange={e => setCurrentPrompt({ ...currentPrompt, content: e.target.value })}
                                        className="w-full h-48 bg-[#2a2a2a] border border-[#3f3f3f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
                                        placeholder="Enter your prompt template..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Tags (comma separated)</label>
                                    <input
                                        value={currentPrompt.tags}
                                        onChange={e => setCurrentPrompt({ ...currentPrompt, tags: e.target.value })}
                                        className="w-full bg-[#2a2a2a] border border-[#3f3f3f] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g., coding, email, productivity"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3f3f3f] text-gray-300 rounded-lg transition-colors">Cancel</button>
                                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Save Template</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            {/* Search Bar */}
                            <div className="p-4 border-b border-[#2f2f2f] flex gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search templates..."
                                        className="w-full bg-[#212121] border border-[#3f3f3f] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => { setCurrentPrompt({ title: '', content: '', tags: '' }); setIsEditing(true); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    New
                                </button>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {filteredPrompts.map(prompt => (
                                    <div key={prompt.id} className="group p-4 bg-[#212121] hover:bg-[#2a2a2a] border border-[#2f2f2f] hover:border-indigo-500/30 rounded-xl transition-all cursor-pointer" onClick={() => onSelectPrompt(prompt.content)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4 text-indigo-400" />
                                                <h3 className="font-medium text-white">{prompt.title}</h3>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setCurrentPrompt(prompt); setIsEditing(true); }}
                                                    className="p-1.5 hover:bg-[#3f3f3f] rounded-lg text-gray-400 hover:text-white"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(prompt.id); }}
                                                    className="p-1.5 hover:bg-[#3f3f3f] rounded-lg text-gray-400 hover:text-red-400"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-2 mb-3 font-mono bg-[#1a1a1a] p-2 rounded-lg border border-[#2f2f2f]/50">
                                            {prompt.content}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {prompt.tags.split(',').map((tag, i) => (
                                                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#2f2f2f] text-gray-400 border border-[#3f3f3f]">#{tag.trim()}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {filteredPrompts.length === 0 && (
                                    <div className="text-center py-10">
                                        <p className="text-gray-500">No templates found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromptLibraryModal;
