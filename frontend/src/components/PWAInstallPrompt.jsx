import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Hide the prompt
        setShowPrompt(false);

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, so clearing it
        setDeferredPrompt(null);
    };

    const handleClose = () => {
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-[#2f2f2f] border border-[#424242] p-4 rounded-xl shadow-2xl z-50 flex items-start gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0 border border-emerald-500/20">
                <img src="icons/logo-hdi.png" alt="App Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Install ChatHDI</h3>
                <p className="text-sm text-gray-400 mb-3">
                    Install aplikasi untuk pengalaman chat yang lebih cepat, fullscreen, dan akses offline.
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={handleInstallClick}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Install Sekarang
                    </button>
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-[#424242] hover:bg-[#525252] text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Nanti
                    </button>
                </div>
            </div>
            <button
                onClick={handleClose}
                className="text-gray-500 hover:text-white transition-colors"
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    );
};

export default PWAInstallPrompt;
