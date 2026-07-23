'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  Globe,
  Info,
  Laptop,
  LogOut,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '../contexts/AuthContext';
import { deleteConversationFromSupabase } from '../supabaseClient';
import { cn } from '../lib/utils';

const RESPONSE_LANGUAGE_KEY = 'chathdi.responseLanguage';

const tabs = [
  { id: 'general', label: 'Umum', icon: Monitor },
  { id: 'account', label: 'Akun', icon: User },
  { id: 'data', label: 'Data & Penyimpanan', icon: Database },
  { id: 'about', label: 'Tentang', icon: Info },
];

const formatDate = value => {
  if (!value) return 'Belum tersedia';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return 'Belum tersedia';
  }
};

const SettingsModal = ({
  onClose,
  conversations = [],
  onConversationsCleared,
}) => {
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [responseLanguage, setResponseLanguage] = useState('id');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    setMounted(true);
    const savedLanguage = window.localStorage.getItem(RESPONSE_LANGUAGE_KEY);
    if (savedLanguage === 'en' || savedLanguage === 'id') {
      setResponseLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const messageCount = useMemo(
    () => conversations.reduce(
      (total, conversation) => total + (conversation.messages?.length || 0),
      0
    ),
    [conversations]
  );

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Pengguna';
  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff`;
  const emailVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
  const activeTheme = mounted ? (theme || 'system') : 'system';
  const themeIcon = resolvedTheme === 'light' ? Sun : Moon;
  const ThemeIcon = mounted ? themeIcon : Laptop;

  const handleLanguageChange = event => {
    const nextLanguage = event.target.value;
    setResponseLanguage(nextLanguage);
    window.localStorage.setItem(RESPONSE_LANGUAGE_KEY, nextLanguage);
    setStatusMessage(
      nextLanguage === 'en'
        ? 'Respons AI berikutnya akan menggunakan bahasa Inggris.'
        : 'Respons AI berikutnya akan menggunakan Bahasa Indonesia.'
    );
  };

  const handleExportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user?.id || null,
        email: user?.email || null,
      },
      conversations,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chathdi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatusMessage('Backup percakapan berhasil dibuat.');
  };

  const handleClearAllChats = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setStatusMessage('');
      return;
    }

    setIsDeleting(true);
    setStatusMessage('');
    try {
      const results = await Promise.all(
        conversations.map(conversation =>
          deleteConversationFromSupabase(conversation.id)
        )
      );
      const failures = results.filter(result => !result?.success);
      if (failures.length > 0) {
        throw new Error(`${failures.length} percakapan gagal dihapus dari server.`);
      }

      onConversationsCleared?.();
      setConfirmDelete(false);
      setStatusMessage('Semua percakapan berhasil dihapus.');
    } catch (error) {
      console.error('Failed to delete all chats:', error);
      setStatusMessage(error.message || 'Percakapan gagal dihapus.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Failed to sign out:', error);
      setStatusMessage('Gagal keluar dari akun. Silakan coba lagi.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-0 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="flex h-full w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-[#1a1a1a] sm:h-[min(720px,calc(100vh-2rem))] sm:rounded-2xl sm:border sm:border-gray-200 sm:dark:border-[#343434] md:flex-row"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <aside className="flex shrink-0 flex-col border-b border-gray-200 bg-gray-50 dark:border-[#2f2f2f] dark:bg-[#171717] md:w-60 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-[#2f2f2f] md:px-5 md:py-6">
            <h2
              id="settings-title"
              className="flex items-center gap-2 text-lg font-bold text-gray-950 dark:text-white"
            >
              <span className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-600 dark:text-emerald-400">
                <SettingsIcon className="h-5 w-5" />
              </span>
              Pengaturan
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-[#2f2f2f] dark:hover:text-white md:hidden"
              aria-label="Tutup pengaturan"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col md:overflow-y-auto md:p-3">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setConfirmDelete(false);
                    setStatusMessage('');
                  }}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:w-full md:gap-3',
                    activeTab === tab.id
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'text-gray-600 hover:bg-gray-200 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-white'
                  )}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="hidden border-t border-gray-200 p-4 dark:border-[#2f2f2f] md:block">
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-[#343434] dark:bg-[#222222]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                  Akun aktif
                </p>
                <p className="truncate text-[11px] text-gray-500">
                  {user?.email || 'Tidak ada email'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col">
          <header className="hidden items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-[#2f2f2f] md:flex">
            <div>
              <h3 className="text-lg font-semibold text-gray-950 dark:text-white">
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h3>
              <p className="mt-0.5 text-sm text-gray-500">
                Kelola preferensi dan data ChatHDI Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-[#2f2f2f] dark:hover:text-white"
              aria-label="Tutup pengaturan"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {statusMessage && (
              <div
                className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300"
                role="status"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {statusMessage}
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-7">
                <SettingsSection title="Tampilan">
                  <SettingCard>
                    <SettingDescription
                      icon={ThemeIcon}
                      iconClassName="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                      title="Tema aplikasi"
                      description="Gunakan tema sistem, gelap, atau terang."
                    />
                    <select
                      value={activeTheme}
                      onChange={event => setTheme(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-[#454545] dark:bg-[#171717] dark:text-white sm:w-auto"
                      aria-label="Tema aplikasi"
                    >
                      <option value="system">Ikuti sistem</option>
                      <option value="dark">Gelap</option>
                      <option value="light">Terang</option>
                    </select>
                  </SettingCard>
                </SettingsSection>

                <SettingsSection title="Bahasa">
                  <SettingCard>
                    <SettingDescription
                      icon={Globe}
                      iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      title="Bahasa respons AI"
                      description="Bahasa default untuk jawaban model AI."
                    />
                    <select
                      value={responseLanguage}
                      onChange={handleLanguageChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-[#454545] dark:bg-[#171717] dark:text-white sm:w-auto"
                      aria-label="Bahasa respons AI"
                    >
                      <option value="id">Bahasa Indonesia</option>
                      <option value="en">English</option>
                    </select>
                  </SettingCard>
                </SettingsSection>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-5 rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-5 sm:flex-row sm:items-center">
                  <img
                    src={avatarUrl}
                    alt={`Avatar ${displayName}`}
                    className="h-20 w-20 rounded-full border-2 border-emerald-500/20 object-cover"
                  />
                  <div className="min-w-0">
                    <h4 className="truncate text-xl font-bold text-gray-950 dark:text-white">
                      {displayName}
                    </h4>
                    <p className="truncate text-sm text-emerald-700 dark:text-emerald-400">
                      {user?.email || 'Email tidak tersedia'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-xs text-gray-700 dark:border-[#454545] dark:bg-[#222222] dark:text-gray-300">
                        Akun standar
                      </span>
                      <span
                        className={cn(
                          'rounded-md border px-2 py-1 text-xs',
                          emailVerified
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        )}
                      >
                        {emailVerified ? 'Email terverifikasi' : 'Email belum terverifikasi'}
                      </span>
                    </div>
                  </div>
                </div>

                <SettingsSection title="Informasi sesi">
                  <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-[#343434] dark:border-[#343434]">
                    <InfoRow label="ID pengguna" value={user?.id || 'Tidak tersedia'} mono />
                    <InfoRow label="Login terakhir" value={formatDate(user?.last_sign_in_at)} />
                    <InfoRow label="Penyedia login" value={user?.app_metadata?.provider || 'email'} />
                  </div>
                </SettingsSection>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-medium text-red-600 transition-colors hover:bg-red-500/15 dark:text-red-400"
                >
                  <LogOut className="h-5 w-5" />
                  Keluar dari akun
                </button>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-7">
                <SettingsSection title="Ringkasan data">
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Percakapan" value={conversations.length} />
                    <StatCard label="Pesan" value={messageCount} />
                  </div>
                </SettingsSection>

                <SettingsSection title="Backup">
                  <SettingCard>
                    <SettingDescription
                      icon={Download}
                      iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      title="Ekspor percakapan"
                      description="Unduh seluruh percakapan sebagai file JSON."
                    />
                    <button
                      type="button"
                      onClick={handleExportData}
                      disabled={conversations.length === 0}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#454545] dark:bg-[#242424] dark:text-white dark:hover:bg-[#2f2f2f] sm:w-auto"
                    >
                      Ekspor data
                    </button>
                  </SettingCard>
                </SettingsSection>

                <SettingsSection title="Zona berbahaya">
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-red-500/10 p-2 text-red-600 dark:text-red-400">
                        <Trash2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-medium text-gray-950 dark:text-white">
                          Hapus semua percakapan
                        </h5>
                        <p className="mt-1 text-sm leading-6 text-gray-500">
                          Menghapus riwayat chat dari Supabase dan perangkat ini secara permanen.
                          Buat backup terlebih dahulu jika masih diperlukan.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleClearAllChats}
                            disabled={isDeleting || conversations.length === 0}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting
                              ? 'Menghapus...'
                              : confirmDelete
                                ? 'Konfirmasi hapus semuanya'
                                : 'Hapus semua chat'}
                          </button>
                          {confirmDelete && (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(false)}
                              disabled={isDeleting}
                              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-[#454545] dark:text-gray-300 dark:hover:bg-[#2f2f2f]"
                            >
                              Batal
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </SettingsSection>

                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Kontrol data transparan</p>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                      ChatHDI tidak memiliki fitur penggunaan percakapan untuk training internal.
                      Permintaan AI hanya dikirim ke provider model yang Anda pilih.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="mx-auto max-w-lg space-y-7 py-4 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 p-4">
                  <img
                    src="/icons/logo-hdi.png"
                    alt="Logo ChatHDI"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-950 dark:text-white">ChatHDI</h2>
                  <p className="mt-1 text-gray-500">AI Assistant untuk R&amp;D Engineering</p>
                  <span className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Versi 0.1.0
                  </span>
                </div>

                <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 text-left dark:divide-[#343434] dark:border-[#343434]">
                  <InfoRow label="Frontend & backend" value="Next.js 15 + React 19" />
                  <InfoRow label="Database cloud" value="Supabase" />
                  <InfoRow label="AI lokal" value="Ollama + RAG lokal" />
                </div>

                <a
                  href="https://www.hidrodinamika.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-[#454545] dark:text-gray-300 dark:hover:bg-[#2f2f2f]"
                >
                  Kunjungi website perusahaan
                  <ExternalLink className="h-4 w-4" />
                </a>

                <p className="text-xs text-gray-500">
                  © {new Date().getFullYear()} Hydrogen Development Indonesia.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const SettingsSection = ({ title, children }) => (
  <section className="space-y-3">
    <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
      {title}
    </h4>
    {children}
  </section>
);

const SettingCard = ({ children }) => (
  <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-[#343434] dark:bg-[#242424] sm:flex-row sm:items-center sm:justify-between">
    {children}
  </div>
);

const SettingDescription = ({
  icon: Icon,
  iconClassName,
  title,
  description,
}) => (
  <div className="flex min-w-0 items-start gap-3">
    <div className={cn('rounded-lg p-2', iconClassName)}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="font-medium text-gray-950 dark:text-white">{title}</p>
      <p className="mt-0.5 text-sm leading-5 text-gray-500">{description}</p>
    </div>
  </div>
);

const InfoRow = ({ label, value, mono = false }) => (
  <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <span className="text-sm text-gray-500">{label}</span>
    <span
      className={cn(
        'break-all text-sm text-gray-900 dark:text-gray-200 sm:text-right',
        mono && 'font-mono text-xs'
      )}
    >
      {value}
    </span>
  </div>
);

const StatCard = ({ label, value }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-[#343434] dark:bg-[#242424]">
    <p className="text-2xl font-bold text-gray-950 dark:text-white">{value}</p>
    <p className="mt-1 text-sm text-gray-500">{label}</p>
  </div>
);

const SettingsIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default SettingsModal;
