import React from 'react';
import { Sparkles, Code, BookOpen, Lightbulb, ArrowRight, Zap, Image, FileText, Globe, Brain, Wand2, Database, Atom } from 'lucide-react';

const WelcomeScreen = ({ onSuggestionClick, onFeatureClick }) => {
  const capabilities = [
    { icon: Code, label: 'Coding', color: 'text-blue-400', hoverBg: 'hover:bg-blue-500/20' },
    { icon: Image, label: 'Vision', color: 'text-purple-400', hoverBg: 'hover:bg-purple-500/20' },
    { icon: FileText, label: 'Documents', color: 'text-orange-400', hoverBg: 'hover:bg-orange-500/20' },
    { icon: Globe, label: 'Web Search', color: 'text-green-400', hoverBg: 'hover:bg-green-500/20' },
    { icon: Brain, label: 'Deep Think', color: 'text-pink-400', hoverBg: 'hover:bg-pink-500/20' },
    { icon: Database, label: 'R&D Database', color: 'text-cyan-400', hoverBg: 'hover:bg-cyan-500/20' },
  ];

  const suggestions = [
    {
      icon: Atom,
      title: 'Riset Hidrogen',
      description: 'Eksplorasi teknologi hidrogen & energi terbarukan',
      prompt: 'Jelaskan perkembangan terbaru teknologi produksi green hydrogen menggunakan elektrolisis dan potensi penerapannya di Indonesia',
      gradient: 'from-cyan-500/20 to-blue-500/20',
      borderColor: 'border-cyan-500/30'
    },
    {
      icon: Code,
      title: 'Bantu saya coding',
      description: 'Debug, review, atau tulis kode baru',
      prompt: 'Bantu saya membuat komponen React dengan TypeScript yang menampilkan daftar todo dengan fitur drag and drop',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30'
    },
    {
      icon: BookOpen,
      title: 'Jelaskan konsep',
      description: 'Pelajari topik baru dengan mudah',
      prompt: 'Jelaskan konsep microservices architecture dengan analogi sederhana dan kapan sebaiknya digunakan',
      gradient: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30'
    },
    {
      icon: Lightbulb,
      title: 'Brainstorm ide',
      description: 'Eksplorasi dan kembangkan ide',
      prompt: 'Bantu saya brainstorm ide startup SaaS untuk produktivitas tim remote',
      gradient: 'from-yellow-500/20 to-orange-500/20',
      borderColor: 'border-yellow-500/30'
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      {/* Animated Logo */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl blur-2xl opacity-30 animate-pulse" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
          <span className="text-white font-bold text-3xl">H</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 text-center">
        Halo, saya <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">ChatHDI</span>
      </h1>
      <p className="text-gray-400 text-lg mb-6 text-center max-w-lg">
        Asisten AI generasi terbaru yang lebih cerdas, lebih cepat, dan lebih powerful
      </p>

      {/* Capabilities - Now clickable */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {capabilities.map((cap, index) => (
          <button
            key={index}
            onClick={() => onFeatureClick?.(cap.label)}
            className={`flex items-center gap-2 px-3 py-1.5 bg-[#2f2f2f] rounded-full text-sm transition-all duration-200 ${cap.hoverBg} hover:scale-105 cursor-pointer border border-transparent hover:border-gray-600`}
          >
            <cap.icon className={`h-4 w-4 ${cap.color}`} />
            <span className="text-gray-300">{cap.label}</span>
          </button>
        ))}
      </div>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className={`group relative flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br ${suggestion.gradient} border ${suggestion.borderColor} hover:border-opacity-60 transition-all duration-300 text-left overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="shrink-0 w-12 h-12 rounded-xl bg-[#2f2f2f] flex items-center justify-center group-hover:scale-110 transition-transform">
              <suggestion.icon className="h-6 w-6 text-gray-300" />
            </div>
            <div className="flex-1 min-w-0 relative">
              <div className="font-semibold text-white mb-1 flex items-center gap-2">
                {suggestion.title}
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="text-sm text-gray-400">
                {suggestion.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom hint */}
      <div className="mt-10 flex items-center gap-2 text-gray-500 text-sm">
        <Zap className="h-4 w-4 text-emerald-500" />
        <span>Tekan <kbd className="px-1.5 py-0.5 bg-[#2f2f2f] rounded text-gray-400">Enter</kbd> untuk mengirim, <kbd className="px-1.5 py-0.5 bg-[#2f2f2f] rounded text-gray-400">Shift+Enter</kbd> untuk baris baru</span>
      </div>
    </div>
  );
};

export default WelcomeScreen;
