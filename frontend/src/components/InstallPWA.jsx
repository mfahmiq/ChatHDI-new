import React from 'react';
import { Download, X, Smartphone, Monitor, Check, Package, MonitorIcon, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const InstallPWA = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('pwa');
  const [downloading, setDownloading] = React.useState(null);

  React.useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDownload = async (filename, platform) => {
    setDownloading(platform);
    try {
      const response = await fetch(`${BACKEND_URL}/api/download/${filename}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download gagal. Silakan coba lagi.');
    } finally {
      setDownloading(null);
    }
  };

  const downloads = [
    {
      platform: 'Windows',
      icon: MonitorIcon,
      filename: 'ChatHDI-Windows-1.0.0.zip',
      size: '166 MB',
      instructions: 'Extract ZIP, jalankan ChatHDI.exe'
    },
    {
      platform: 'Linux',
      icon: Package,
      filename: 'ChatHDI-1.0.0.AppImage',
      size: '147 MB',
      instructions: 'chmod +x file, lalu jalankan'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-[#1a1a1a] rounded-2xl w-full max-w-lg overflow-hidden border border-[#2f2f2f]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Download ChatHDI</h2>
              <p className="text-gray-400 text-sm">AI Assistant for R&D Engineering</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2f2f2f]">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'pwa' 
                ? 'text-emerald-400 border-b-2 border-emerald-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Web App (PWA)
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'desktop' 
                ? 'text-emerald-400 border-b-2 border-emerald-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Desktop (.exe)
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'pwa' ? (
            <>
              {isInstalled ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">ChatHDI Sudah Terinstall!</h3>
                  <p className="text-gray-400 text-sm">Buka dari home screen atau app drawer.</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-300 text-sm mb-4">
                    Install ChatHDI sebagai Web App untuk akses cepat.
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Smartphone className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="text-gray-300">Akses offline</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Monitor className="h-4 w-4 text-purple-400" />
                      </div>
                      <span className="text-gray-300">Fullscreen experience</span>
                    </div>
                  </div>

                  {isIOS ? (
                    <div className="bg-[#2f2f2f] rounded-xl p-4 space-y-2">
                      <p className="text-sm font-medium text-white">Cara Install di iOS:</p>
                      <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                        <li>Tap tombol <strong>Share</strong> di Safari</li>
                        <li>Tap <strong>"Add to Home Screen"</strong></li>
                        <li>Tap <strong>"Add"</strong></li>
                      </ol>
                    </div>
                  ) : deferredPrompt ? (
                    <button
                      onClick={handleInstall}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Download className="h-5 w-5" />
                      Install Web App
                    </button>
                  ) : (
                    <div className="bg-[#2f2f2f] rounded-xl p-4 space-y-2">
                      <p className="text-sm font-medium text-white">Cara Install:</p>
                      <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                        <li>Klik menu <strong>⋮</strong> di browser</li>
                        <li>Pilih <strong>"Install app"</strong></li>
                      </ol>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Download ChatHDI sebagai aplikasi desktop standalone.
              </p>

              {downloads.map((download, index) => (
                <div key={index} className="bg-[#2f2f2f] rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <download.icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{download.platform}</h4>
                      <p className="text-xs text-gray-500">{download.size}</p>
                    </div>
                    <button
                      onClick={() => handleDownload(download.filename, download.platform)}
                      disabled={downloading === download.platform}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-all"
                    >
                      {downloading === download.platform ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {download.instructions}
                  </p>
                </div>
              ))}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-400">
                  <strong>Tip:</strong> File cukup besar, pastikan koneksi internet stabil.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#2f2f2f] hover:bg-[#3a3a3a] rounded-xl text-gray-300 font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
