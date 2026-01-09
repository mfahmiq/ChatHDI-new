import React from 'react';
import { 
  Download, Smartphone, Monitor, Apple, Chrome, 
  CheckCircle, Zap, Shield, Globe, ArrowRight,
  Sparkles, Database, Image, FileText, MessageSquare
} from 'lucide-react';

const DownloadPage = () => {
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [installStatus, setInstallStatus] = React.useState('');

  React.useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallStatus('success');
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallStatus('installing');
      }
      setDeferredPrompt(null);
    } else {
      // Show manual instructions
      setInstallStatus('manual');
    }
  };

  const features = [
    { icon: MessageSquare, title: 'AI Chat Cerdas', desc: 'GPT-4o & Claude untuk jawaban akurat' },
    { icon: Image, title: 'Generate Gambar', desc: 'Buat ilustrasi dengan Nano Banana' },
    { icon: FileText, title: 'Buat Presentasi', desc: 'Generate PPTX otomatis' },
    { icon: Database, title: 'R&D Database', desc: 'Akses database riset lengkap' },
  ];

  const platforms = [
    { 
      icon: Chrome, 
      name: 'Chrome / Edge', 
      instructions: [
        'Klik ikon menu (⋮) di pojok kanan atas',
        'Pilih "Install ChatHDI" atau "Add to Home screen"',
        'Konfirmasi instalasi'
      ]
    },
    { 
      icon: Apple, 
      name: 'Safari (iOS/Mac)', 
      instructions: [
        'Klik ikon Share (□↑)',
        'Scroll dan pilih "Add to Home Screen"',
        'Ketuk "Add" untuk konfirmasi'
      ]
    },
    { 
      icon: Smartphone, 
      name: 'Android', 
      instructions: [
        'Buka di Chrome/Firefox',
        'Ketuk "Install" pada banner yang muncul',
        'Atau via menu → "Add to Home screen"'
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-[#171717] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-cyan-500/20" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-emerald-500/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-cyan-500/30 rounded-full blur-[100px]" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="text-center">
            {/* Logo */}
            <div className="inline-flex mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <span className="text-white font-bold text-5xl">H</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Download <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">ChatHDI</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Asisten AI generasi terbaru untuk riset Hidrogen & Energi Terbarukan. 
              Install sekarang dan akses kapan saja, bahkan offline!
            </p>

            {/* Install Button */}
            {isInstalled ? (
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
                <span className="text-emerald-400 font-semibold text-lg">ChatHDI sudah terinstall!</span>
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-2xl font-semibold text-lg shadow-xl shadow-emerald-500/30 transition-all hover:scale-105"
              >
                <Download className="h-6 w-6" />
                Install ChatHDI
              </button>
            )}

            {/* Version info */}
            <p className="mt-4 text-sm text-gray-500">
              Versi 2.2.0 • Ukuran ~2MB • Gratis
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Fitur <span className="text-emerald-400">Unggulan</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-6 bg-[#212121] rounded-2xl border border-[#2f2f2f] hover:border-emerald-500/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Installation Instructions */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">
          Cara <span className="text-emerald-400">Install</span>
        </h2>
        <p className="text-gray-400 text-center mb-12">
          ChatHDI adalah Progressive Web App (PWA) yang bisa diinstall di semua perangkat
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platforms.map((platform, index) => (
            <div 
              key={index}
              className="p-6 bg-[#212121] rounded-2xl border border-[#2f2f2f]"
            >
              <div className="flex items-center gap-3 mb-4">
                <platform.icon className="h-8 w-8 text-gray-300" />
                <h3 className="font-semibold text-lg">{platform.name}</h3>
              </div>
              <ol className="space-y-3">
                {platform.instructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-sm flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <span className="text-gray-400 text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-3xl p-8 md:p-12 border border-emerald-500/20">
          <h2 className="text-3xl font-bold text-center mb-8">
            Kenapa Install ChatHDI?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Akses Cepat</h3>
              <p className="text-gray-400 text-sm">Buka langsung dari home screen tanpa browser</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Aman & Private</h3>
              <p className="text-gray-400 text-sm">Data tersimpan lokal di perangkat Anda</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Update Otomatis</h3>
              <p className="text-gray-400 text-sm">Selalu dapat fitur terbaru tanpa reinstall</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <Sparkles className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Siap Menggunakan ChatHDI?</h2>
        <p className="text-gray-400 mb-8">Mulai chat dengan AI paling cerdas untuk riset energi terbarukan</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {!isInstalled && (
            <button
              onClick={handleInstall}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
            >
              <Download className="h-5 w-5" />
              Install Sekarang
            </button>
          )}
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] rounded-xl font-semibold transition-colors"
          >
            Buka Web Version
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#2f2f2f] py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>© 2024 HDI - Hydrogen Development Indonesia</p>
          <p className="mt-2">ChatHDI v2.2.0 • Made with ❤️ for Indonesian R&D</p>
        </div>
      </footer>

      {/* Manual Install Modal */}
      {installStatus === 'manual' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setInstallStatus('')}>
          <div className="bg-[#1a1a1a] rounded-2xl max-w-md w-full p-6 border border-[#2f2f2f]" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Cara Install Manual</h3>
            <p className="text-gray-400 mb-4">
              Untuk menginstall ChatHDI, gunakan menu browser Anda:
            </p>
            <ul className="space-y-2 text-sm text-gray-300 mb-6">
              <li>• Chrome/Edge: Menu (⋮) → "Install ChatHDI"</li>
              <li>• Safari: Share (□↑) → "Add to Home Screen"</li>
              <li>• Firefox: Menu → "Install"</li>
            </ul>
            <button
              onClick={() => setInstallStatus('')}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-semibold"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadPage;
