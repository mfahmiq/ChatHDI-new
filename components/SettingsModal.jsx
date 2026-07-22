import React, { useState } from 'react';
import {
    X, Moon, Sun, User, Database, Info,
    Trash2, LogOut, Check, ChevronRight, Shield,
    CreditCard, Key, Monitor, Smartphone, Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { deleteConversationFromSupabase } from '../supabaseClient';
import { cn } from '../lib/utils';

const SettingsModal = ({ onClose, conversations, setConversations, setActiveConversation }) => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [theme, setTheme] = useState('dark');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleClearAllChats = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }

        setIsDeleting(true);
        try {
            // Delete all conversations one by one (or batch if API supported)
            // Since specific delete function expects ID, we loop. 
            // Ideally backend should have deleteAll, but for safety we do UI driven batch.
            const deletePromises = conversations.map(c => deleteConversationFromSupabase(c.id));
            await Promise.all(deletePromises);

            setConversations([]);
            setActiveConversation(null);
            setConfirmDelete(false);
            // Optional: Show success toast
        } catch (error) {
            console.error("Failed to delete all chats:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'Umum', icon: <Monitor className="w-4 h-4" /> },
        { id: 'account', label: 'Akun', icon: <User className="w-4 h-4" /> },
        { id: 'data', label: 'Data & Storage', icon: <Database className="w-4 h-4" /> },
        { id: 'about', label: 'Tentang', icon: <Info className="w-4 h-4" /> },
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl h-[600px] border border-[#2f2f2f] shadow-2xl flex overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Sidebar */}
                <div className="w-64 border-r border-[#2f2f2f] bg-[#171717] flex flex-col">
                    <div className="p-6 border-b border-[#2f2f2f]">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="bg-emerald-500/20 text-emerald-500 p-1.5 rounded-lg">
                                <SettingsIcon className="w-5 h-5" />
                            </span>
                            Settings
                        </h2>
                    </div>

                    <div className="p-3 space-y-1 overflow-y-auto flex-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    activeTab === tab.id
                                        ? "bg-emerald-600/10 text-emerald-400"
                                        : "text-gray-400 hover:bg-[#2f2f2f] hover:text-white"
                                )}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t border-[#2f2f2f]">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#2f2f2f]/50 border border-[#2f2f2f]">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs text-white font-bold">
                                Pro
                            </div>
                            <div>
                                <p className="text-xs font-medium text-white">ChatHDI Pro</p>
                                <p className="text-[10px] text-gray-500">Active until Dec 2025</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col bg-[#1a1a1a] min-h-0">
                    <div className="flex items-center justify-between p-6 border-b border-[#2f2f2f]">
                        <h3 className="text-lg font-semibold text-white">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">

                        {/* -- GENERAL TAB -- */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Tampilan</h4>

                                    <div className="flex items-center justify-between p-4 bg-[#2f2f2f]/50 rounded-xl border border-[#2f2f2f]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">Tema Aplikasi</p>
                                                <p className="text-sm text-gray-500">Ganti tampilan gelap/terang</p>
                                            </div>
                                        </div>
                                        <select
                                            value={theme}
                                            onChange={(e) => setTheme(e.target.value)}
                                            className="bg-[#1a1a1a] text-white text-sm border border-[#40414f] rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500"
                                        >
                                            <option value="system">System</option>
                                            <option value="dark">Dark</option>
                                            <option value="light">Light</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Bahasa</h4>
                                    <div className="flex items-center justify-between p-4 bg-[#2f2f2f]/50 rounded-xl border border-[#2f2f2f]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                                <Globe className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">Bahasa Utama</p>
                                                <p className="text-sm text-gray-500">Bahasa antarmuka aplikasi</p>
                                            </div>
                                        </div>
                                        <select className="bg-[#1a1a1a] text-white text-sm border border-[#40414f] rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500">
                                            <option value="id">Bahasa Indonesia</option>
                                            <option value="en">English (US)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* -- ACCOUNT TAB -- */}
                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                <div className="p-6 bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 rounded-xl border border-emerald-500/10 flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 p-1">
                                        <img
                                            src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}`}
                                            alt="Avatar"
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white">{user?.user_metadata?.full_name || 'User'}</h4>
                                        <p className="text-emerald-400">{user?.email}</p>
                                        <div className="mt-2 flex gap-2">
                                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-md border border-emerald-500/20">Pro Plan</span>
                                            <span className="px-2 py-0.5 bg-[#2f2f2f] text-gray-400 text-xs rounded-md border border-[#40414f]">Verified</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Subscription</h4>
                                    <div className="p-4 bg-[#2f2f2f]/30 rounded-xl border border-[#2f2f2f] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-white font-medium">Free Tier (Gratis)</p>
                                                <p className="text-sm text-gray-500">Upgrade untuk fitur FLUX.1 Unlimited</p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                                            Upgrade
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[#2f2f2f]">
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors border border-red-500/20"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* -- DATA TAB -- */}
                        {activeTab === 'data' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Data Pengguna</h4>

                                    <div className="p-4 bg-[#2f2f2f]/30 rounded-xl border border-[#2f2f2f]">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-red-500/10 rounded-lg text-red-500 mt-1">
                                                <Trash2 className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="text-white font-medium mb-1">Hapus Semua Percakapan</h5>
                                                <p className="text-sm text-gray-500 mb-4">
                                                    Tindakan ini akan menghapus semua riwayat chat Anda secara permanen. Data yang dihapus tidak dapat dikembalikan.
                                                </p>

                                                {confirmDelete ? (
                                                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                                        <button
                                                            onClick={handleClearAllChats}
                                                            disabled={isDeleting}
                                                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                                        >
                                                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Semuanya'}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(false)}
                                                            disabled={isDeleting}
                                                            className="px-4 py-2 bg-[#40414f] hover:bg-[#505163] text-white text-sm font-medium rounded-lg transition-colors"
                                                        >
                                                            Batal
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmDelete(true)}
                                                        className="px-4 py-2 bg-[#2f2f2f] hover:bg-red-900/20 text-red-400 border border-[#40414f] hover:border-red-500/50 text-sm font-medium rounded-lg transition-all"
                                                    >
                                                        Hapus Data Chat
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Privacy</h4>
                                    <div className="p-4 bg-[#2f2f2f]/30 rounded-xl border border-[#2f2f2f] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-5 h-5 text-emerald-500" />
                                            <div>
                                                <p className="text-white font-medium">Training Data</p>
                                                <p className="text-sm text-gray-500">Izinkan data chat digunakan untuk training model</p>
                                            </div>
                                        </div>
                                        <input type="checkbox" className="toggle toggle-success" defaultChecked />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* -- ABOUT TAB -- */}
                        {activeTab === 'about' && (
                            <div className="space-y-6 text-center pt-8">
                                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-3xl flex items-center justify-center p-4 border border-emerald-500/20 shadow-xl shadow-emerald-900/20">
                                    <img src="icons/logo-hdi.png" alt="Logo" className="w-full h-full object-contain" />
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">ChatHDI Desktop</h2>
                                    <p className="text-gray-400">Version 2.3.0 (BETA)</p>
                                    <p className="text-emerald-500 text-sm font-medium mt-1">Windows Edition</p>
                                </div>

                                <div className="max-w-sm mx-auto space-y-3 mt-8">
                                    <div className="flex justify-between py-2 border-b border-[#2f2f2f]">
                                        <span className="text-gray-500 text-sm">Framework</span>
                                        <span className="text-white text-sm">Electron + React</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-[#2f2f2f]">
                                        <span className="text-gray-500 text-sm">Backend</span>
                                        <span className="text-white text-sm">Python FastAPI</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-[#2f2f2f]">
                                        <span className="text-gray-500 text-sm">Database</span>
                                        <span className="text-white text-sm">Supabase + MongoDB</span>
                                    </div>
                                </div>

                                <div className="pt-8 text-xs text-gray-600">
                                    <p>Designed for High-Performance R&D Workflows</p>
                                    <p>© 2024 Hydrogen Development Indonesia. All rights reserved.</p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper icon
const SettingsIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
);

export default SettingsModal;
