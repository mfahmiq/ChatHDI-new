import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Newspaper, ExternalLink, Calendar, RefreshCw, 
  Play, Share2, Search, ArrowUpRight, Loader2, Sparkles 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const AINews = ({ isOpen, onClose }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [shareTooltip, setShareTooltip] = useState(null);

  // Fetch news articles
  const fetchNews = useCallback(async (force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);

      const url = `/api/news${force ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.news) {
        setNews(data.news);
      }
    } catch (error) {
      console.error('Failed to fetch AI News:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNews();
    }
  }, [isOpen, fetchNews]);

  // Clean HTML titles or entities
  const cleanTitle = (str) => {
    if (!str) return '';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&#8217;/g, "'");
  };

  // Filter logic
  const filteredNews = news.filter(art => {
    const matchesSearch = searchQuery === '' || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource = selectedSource === 'all' || art.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  const handleShare = (art, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(art.url);
    setShareTooltip(art.url);
    setTimeout(() => setShareTooltip(null), 2000);
  };

  // Format Date to Indonsian
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, { addSuffix: true, locale: id });
    } catch (e) {
      return dateStr;
    }
  };

  // Get unique sources dynamically from the news items
  const dynamicSources = ['all', ...new Set(news.map(art => art.source))].slice(0, 15);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[#171717]/95 border border-[#2f2f2f] w-full max-w-6xl h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2f2f2f] bg-gradient-to-r from-emerald-950/20 to-teal-950/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Newspaper className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">AI Daily Feed</h2>
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                  <Sparkles className="w-3 h-3" /> LIVE UPDATE
                </span>
              </div>
              <p className="text-xs text-gray-400">Rangkuman berita dan video perkembangan kecerdasan buatan terhangat hari ini</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchNews(true)}
              disabled={loading || refreshing}
              className="p-2.5 bg-[#262626] hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white rounded-xl transition-all border border-[#3f3f3f]"
              title="Perbarui Berita"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 bg-[#262626] hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-all border border-[#3f3f3f]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-[#1f1f1f]/50 border-b border-[#2f2f2f] flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Source Tabs */}
          <div className="flex gap-1.5 bg-[#121212] p-1.5 rounded-xl border border-[#2f2f2f] w-full md:w-auto overflow-x-auto scrollbar-none">
            {dynamicSources.map(src => (
              <button
                key={src}
                onClick={() => setSelectedSource(src)}
                className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  selectedSource === src 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-[#262626]'
                }`}
              >
                {src === 'all' ? 'Semua Sumber' : src}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari berita..."
              className="w-full bg-[#121212] border border-[#2f2f2f] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#1a1a1a]/30">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-emerald-500 gap-3">
              <Loader2 className="h-9 w-9 animate-spin" />
              <p className="text-sm font-medium text-gray-400">Menghubungkan ke Feed Berita AI...</p>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Newspaper className="h-12 w-12 text-gray-600 mb-3" />
              <h3 className="text-base font-semibold text-white">Tidak Ada Berita Ditemukan</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">Coba ubah filter sumber atau masukkan kata kunci pencarian yang lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((art, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedArticle(art)}
                  className="group bg-[#212121]/50 border border-[#2f2f2f] hover:border-emerald-500/30 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-emerald-500/5 transition-all flex flex-col h-[400px]"
                >
                  {/* Article Thumbnail */}
                  <div className="relative h-44 w-full overflow-hidden bg-[#1f1f1f]">
                    <img 
                      src={art.image_url} 
                      alt={cleanTitle(art.title)}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=60';
                      }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-black/60 backdrop-blur-sm text-emerald-400 border-emerald-500/30">
                      {art.source}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(art.published_at)}</span>
                      </div>
                      <h3 className="font-bold text-white text-sm leading-snug line-clamp-3 group-hover:text-emerald-400 transition-colors">
                        {cleanTitle(art.title)}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-3 font-normal leading-relaxed">
                        {art.summary}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#2f2f2f] mt-3">
                      <span className="text-[11px] text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Baca Selengkapnya <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleShare(art, e)}
                          className="p-1.5 hover:bg-[#333333] rounded-lg text-gray-400 hover:text-white transition-colors relative"
                          title="Salin Tautan"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          {shareTooltip === art.url && (
                            <span className="absolute bottom-8 right-0 bg-emerald-600 text-white text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap">
                              Tautan Disalin!
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Article Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-[#1c1c1c] border border-[#2f2f2f] w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2f2f2f] bg-[#171717]">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {selectedArticle.source}
              </span>
              <button 
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 hover:bg-[#262626] text-gray-400 hover:text-white rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Title & Metadata */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>Diterbitkan: {formatDate(selectedArticle.published_at)}</span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-white leading-tight">
                  {cleanTitle(selectedArticle.title)}
                </h1>
              </div>

              {/* Video Player */}
              {selectedArticle.video_url && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-emerald-500 fill-emerald-500" /> 
                    {selectedArticle.source === 'Instagram' ? 'Postingan Instagram' : 'Video Terkait (YouTube)'}
                  </h3>
                  <div className={`relative w-full overflow-hidden rounded-xl border border-[#2f2f2f] bg-[#121212] ${
                    selectedArticle.source === 'Instagram' ? 'h-[960px]' : 'aspect-video'
                  }`}>
                    <iframe
                      src={selectedArticle.video_url}
                      title={`Media terkait: ${selectedArticle.title}`}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; gyroscope; accelerometer"
                      allowFullScreen
                      scrolling="auto"
                    ></iframe>
                  </div>
                </div>
              )}

              {/* Cover Image */}
              {!selectedArticle.video_url && (
                <div className="w-full h-64 md:h-80 overflow-hidden rounded-xl border border-[#2f2f2f] bg-[#121212]">
                  <img 
                    src={selectedArticle.image_url} 
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content / Summary */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Artikel Lengkap</h3>
                <div className="space-y-4 text-sm md:text-base text-gray-300 leading-relaxed font-normal">
                  {(selectedArticle.content || selectedArticle.summary).split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-[#2f2f2f] bg-[#171717] flex gap-3">
              <button
                onClick={() => setSelectedArticle(null)}
                className="flex-1 py-3 bg-[#262626] hover:bg-[#333333] rounded-xl text-gray-300 font-semibold text-xs tracking-wide transition-colors"
              >
                Tutup
              </button>
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10"
              >
                Kunjungi Sumber Asli <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AINews;
