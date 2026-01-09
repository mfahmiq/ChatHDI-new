import React from 'react';
import { 
  Search, Filter, Download, FileText, BookOpen, Beaker, FlaskConical, 
  Building2, Globe, Calendar, Users, ExternalLink, ChevronDown, X,
  FileSpreadsheet, FileJson, Printer, Star, Bookmark, Share2,
  Microscope, Atom, Zap, Wind, Sun, Leaf, Database, TrendingUp,
  Plus, Edit, Trash2, RefreshCw, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const RnDDatabase = ({ isOpen, onClose, onAskAI, isAdmin = false }) => {
  const [activeTab, setActiveTab] = React.useState('papers');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedCountry, setSelectedCountry] = React.useState('all');
  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState([]);
  const [detailItem, setDetailItem] = React.useState(null);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [editItem, setEditItem] = React.useState(null);
  
  // Data state - fetched from backend
  const [data, setData] = React.useState({
    papers: [],
    equipment: [],
    materials: [],
    institutions: [],
    categories: {},
    countries: []
  });
  const [loading, setLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState(null);

  // Fetch data from backend
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Initialize database if needed
      await fetch(`${API_URL}/api/rnd/init`, { method: 'POST' });
      
      // Fetch all data
      const response = await fetch(`${API_URL}/api/rnd/all`);
      const result = await response.json();
      
      setData({
        papers: result.papers || [],
        equipment: result.equipment || [],
        materials: result.materials || [],
        institutions: result.institutions || [],
        categories: result.categories || {},
        countries: result.countries || []
      });
      setLastUpdated(result.lastUpdated);
    } catch (error) {
      console.error('Error fetching R&D data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  React.useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  // Auto-refresh every 30 seconds for live updates
  React.useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [isOpen, fetchData]);

  const tabs = [
    { id: 'papers', label: 'Riset & Publikasi', icon: BookOpen, count: data.papers.length },
    { id: 'equipment', label: 'Alat Laboratorium', icon: Microscope, count: data.equipment.length },
    { id: 'materials', label: 'Bahan & Material', icon: FlaskConical, count: data.materials.length },
    { id: 'institutions', label: 'Institusi Riset', icon: Building2, count: data.institutions.length }
  ];

  const getFilteredData = () => {
    let items = [];
    switch(activeTab) {
      case 'papers': items = data.papers; break;
      case 'equipment': items = data.equipment; break;
      case 'materials': items = data.materials; break;
      case 'institutions': items = data.institutions; break;
      default: items = [];
    }

    return items.filter(item => {
      const matchesSearch = searchQuery === '' || 
        JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
        item.category === selectedCategory || item.type === selectedCategory;
      const matchesCountry = selectedCountry === 'all' || item.country === selectedCountry;
      return matchesSearch && matchesCategory && matchesCountry;
    });
  };

  const handleExport = (format) => {
    const items = selectedItems.length > 0 
      ? getFilteredData().filter(item => selectedItems.includes(item.id))
      : getFilteredData();
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rnd_${activeTab}_export.json`;
      a.click();
    } else if (format === 'csv') {
      const headers = Object.keys(items[0] || {}).join(',');
      const rows = items.map(item => Object.values(item).map(v => 
        typeof v === 'object' ? JSON.stringify(v) : v
      ).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rnd_${activeTab}_export.csv`;
      a.click();
    }
  };

  const toggleSelect = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAskAI = (item) => {
    const prompt = activeTab === 'papers' 
      ? `Jelaskan tentang penelitian "${item.title}" oleh ${item.authors?.join(', ')}. Apa temuan utamanya dan bagaimana relevansinya dengan teknologi hidrogen?`
      : activeTab === 'equipment'
      ? `Jelaskan fungsi dan cara kerja ${item.name} (${item.model}) dalam riset energi terbarukan. Apa aplikasi utamanya?`
      : activeTab === 'materials'
      ? `Jelaskan tentang material ${item.name} (${item.formula}). Apa properti, aplikasi, dan cara penanganannya dalam riset hidrogen?`
      : `Berikan informasi tentang ${item.name}. Apa fokus riset dan fasilitas unggulan mereka di bidang energi terbarukan?`;
    
    onAskAI(prompt);
    onClose();
  };

  // CRUD Operations for Admin
  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus ${item.title || item.name}?`)) return;
    
    try {
      const endpoint = activeTab === 'papers' ? 'papers' 
        : activeTab === 'equipment' ? 'equipment'
        : activeTab === 'materials' ? 'materials' 
        : 'institutions';
      
      await fetch(`${API_URL}/api/rnd/${endpoint}/${item.id}`, {
        method: 'DELETE'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Gagal menghapus item');
    }
  };

  const handleSave = async (formData) => {
    try {
      const endpoint = activeTab === 'papers' ? 'papers' 
        : activeTab === 'equipment' ? 'equipment'
        : activeTab === 'materials' ? 'materials' 
        : 'institutions';
      
      const method = editItem ? 'PUT' : 'POST';
      const url = editItem 
        ? `${API_URL}/api/rnd/${endpoint}/${editItem.id}`
        : `${API_URL}/api/rnd/${endpoint}`;
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formData })
      });
      
      setShowAddModal(false);
      setEditItem(null);
      fetchData();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Gagal menyimpan item');
    }
  };

  if (!isOpen) return null;

  const filteredData = getFilteredData();
  const currentCategories = data.categories[activeTab] || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden border border-[#2f2f2f]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2f2f2f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">R&D Database</h2>
              <p className="text-sm text-gray-400">
                Hydrogen & Renewable Energy Research
                {lastUpdated && (
                  <span className="ml-2 text-emerald-400">
                    • Updated {new Date(lastUpdated).toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchData}
              className="p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white"
              title="Refresh data"
            >
              <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-[#2f2f2f] overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedCategory('all'); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-[#2f2f2f]'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className="px-1.5 py-0.5 rounded bg-[#2f2f2f] text-xs">{tab.count}</span>
            </button>
          ))}
          
          {/* Admin Add Button */}
          {isAdmin && (
            <button
              onClick={() => { setEditItem(null); setShowAddModal(true); }}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-sm font-medium text-emerald-400"
            >
              <Plus className="h-4 w-4" />
              Tambah
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-4 border-b border-[#2f2f2f] space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder={`Cari ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2f2f2f] text-white pl-11 pr-4 py-2.5 rounded-xl outline-none border border-transparent focus:border-blue-500/50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors',
                showFilters ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-[#2f2f2f] text-gray-400 hover:text-white'
              )}
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#2f2f2f] rounded-xl text-gray-400 hover:text-white">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-[#2f2f2f] rounded-lg border border-[#424242] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#3a3a3a] w-full">
                  <FileSpreadsheet className="h-4 w-4" /> Export CSV
                </button>
                <button onClick={() => handleExport('json')} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#3a3a3a] w-full">
                  <FileJson className="h-4 w-4" /> Export JSON
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#2f2f2f] text-white px-4 py-2 rounded-lg outline-none border border-transparent focus:border-blue-500/50"
              >
                <option value="all">Semua Kategori</option>
                {currentCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-[#2f2f2f] text-white px-4 py-2 rounded-lg outline-none border border-transparent focus:border-blue-500/50"
              >
                <option value="all">Semua Negara</option>
                {data.countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              {selectedItems.length > 0 && (
                <span className="text-sm text-blue-400">
                  {selectedItems.length} item dipilih
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
              <span className="ml-3 text-gray-400">Memuat data...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredData.map(item => (
                <DataCard 
                  key={item.id} 
                  item={item} 
                  type={activeTab}
                  isSelected={selectedItems.includes(item.id)}
                  onSelect={() => toggleSelect(item.id)}
                  onDetail={() => setDetailItem(item)}
                  onAskAI={() => handleAskAI(item)}
                  isAdmin={isAdmin}
                  onEdit={() => { setEditItem(item); setShowAddModal(true); }}
                  onDelete={() => handleDelete(item)}
                />
              ))}
            </div>
          )}
          {!loading && filteredData.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Tidak ada data yang ditemukan</p>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {detailItem && (
          <DetailModal 
            item={detailItem} 
            type={activeTab} 
            onClose={() => setDetailItem(null)}
            onAskAI={() => handleAskAI(detailItem)}
          />
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <AddEditModal
            type={activeTab}
            item={editItem}
            categories={currentCategories}
            countries={data.countries}
            onClose={() => { setShowAddModal(false); setEditItem(null); }}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
};

// Data Card Component
const DataCard = ({ item, type, isSelected, onSelect, onDetail, onAskAI, isAdmin, onEdit, onDelete }) => {
  const getIcon = () => {
    switch(type) {
      case 'papers': return <FileText className="h-5 w-5" />;
      case 'equipment': return <Microscope className="h-5 w-5" />;
      case 'materials': return <Atom className="h-5 w-5" />;
      case 'institutions': return <Building2 className="h-5 w-5" />;
      default: return <Database className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (cat) => {
    const colors = {
      'Hydrogen Production': 'bg-blue-500/20 text-blue-400',
      'Hydrogen Storage': 'bg-purple-500/20 text-purple-400',
      'Fuel Cells': 'bg-green-500/20 text-green-400',
      'Solar Energy': 'bg-yellow-500/20 text-yellow-400',
      'Wind Energy': 'bg-cyan-500/20 text-cyan-400',
      'Catalyst': 'bg-orange-500/20 text-orange-400',
      'Membrane': 'bg-pink-500/20 text-pink-400',
      'University': 'bg-indigo-500/20 text-indigo-400',
      'Government Lab': 'bg-emerald-500/20 text-emerald-400'
    };
    return colors[cat] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className={cn(
      'bg-[#242424] rounded-xl p-4 border transition-all cursor-pointer hover:border-blue-500/50',
      isSelected ? 'border-blue-500' : 'border-[#2f2f2f]'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-lg', getCategoryColor(item.category || item.type))}>
          {getIcon()}
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1.5 rounded-lg hover:bg-blue-500/20 text-gray-500 hover:text-blue-400"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isSelected ? 'bg-blue-500 text-white' : 'hover:bg-[#2f2f2f] text-gray-500'
            )}
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-white mb-2 line-clamp-2" onClick={onDetail}>
        {item.title || item.name}
      </h3>

      {type === 'papers' && (
        <>
          <p className="text-sm text-gray-400 mb-2 line-clamp-1">
            {item.authors?.slice(0, 2).join(', ')}{item.authors?.length > 2 && ' et al.'}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{item.year}</span>
            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{item.citations} citations</span>
          </div>
        </>
      )}

      {type === 'equipment' && (
        <>
          <p className="text-sm text-gray-400 mb-2">{item.manufacturer} - {item.model}</p>
          <div className={cn(
            'inline-flex px-2 py-0.5 rounded text-xs font-medium mb-3',
            item.status === 'Available' ? 'bg-green-500/20 text-green-400' :
            item.status === 'In Use' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          )}>
            {item.status}
          </div>
        </>
      )}

      {type === 'materials' && (
        <>
          <p className="text-sm text-gray-400 mb-1">{item.formula}</p>
          <p className="text-xs text-gray-500 mb-3">Stock: {item.stock} {item.unit}</p>
        </>
      )}

      {type === 'institutions' && (
        <>
          <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
            <Globe className="h-3 w-3" /> {item.city}, {item.country}
          </p>
          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
            <Users className="h-3 w-3" /> {item.employees?.toLocaleString()} employees
          </p>
        </>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className={cn('px-2 py-0.5 rounded-full text-xs', getCategoryColor(item.category || item.type))}>
          {item.category || item.type}
        </span>
        {item.country && <span className="px-2 py-0.5 rounded-full text-xs bg-[#2f2f2f] text-gray-400">{item.country}</span>}
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onDetail}
          className="flex-1 px-3 py-1.5 bg-[#2f2f2f] hover:bg-[#3a3a3a] rounded-lg text-sm text-gray-300 transition-colors"
        >
          Detail
        </button>
        <button 
          onClick={onAskAI}
          className="flex-1 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors"
        >
          Tanya AI
        </button>
      </div>
    </div>
  );
};

// Detail Modal Component
const DetailModal = ({ item, type, onClose, onAskAI }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-[#2f2f2f]" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#1a1a1a] px-6 py-4 border-b border-[#2f2f2f] flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Detail {type === 'papers' ? 'Publikasi' : type === 'equipment' ? 'Alat' : type === 'materials' ? 'Material' : 'Institusi'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">{item.title || item.name}</h2>
          
          {type === 'papers' && (
            <>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300"><span className="text-gray-500">Penulis:</span> {item.authors?.join(', ')}</p>
                <p className="text-gray-300"><span className="text-gray-500">Institusi:</span> {item.institution}</p>
                <p className="text-gray-300"><span className="text-gray-500">Jurnal:</span> {item.journal} ({item.year})</p>
                <p className="text-gray-300"><span className="text-gray-500">DOI:</span> {item.doi}</p>
                <p className="text-gray-300"><span className="text-gray-500">Citations:</span> {item.citations}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Abstract</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{item.abstract}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {item.keywords?.map(kw => (
                    <span key={kw} className="px-2 py-1 bg-[#2f2f2f] rounded text-xs text-gray-300">{kw}</span>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === 'equipment' && (
            <>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300"><span className="text-gray-500">Manufacturer:</span> {item.manufacturer}</p>
                <p className="text-gray-300"><span className="text-gray-500">Model:</span> {item.model}</p>
                <p className="text-gray-300"><span className="text-gray-500">Lokasi:</span> {item.location}</p>
                <p className="text-gray-300"><span className="text-gray-500">Status:</span> {item.status}</p>
                <p className="text-gray-300"><span className="text-gray-500">Harga:</span> {item.priceRange}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Spesifikasi</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(item.specifications || {}).map(([key, value]) => (
                    <div key={key} className="bg-[#2f2f2f] p-2 rounded">
                      <p className="text-xs text-gray-500 capitalize">{key}</p>
                      <p className="text-sm text-gray-300">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Aplikasi</h4>
                <ul className="list-disc list-inside text-sm text-gray-300">
                  {item.applications?.map(app => <li key={app}>{app}</li>)}
                </ul>
              </div>
            </>
          )}

          {type === 'materials' && (
            <>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300"><span className="text-gray-500">Formula:</span> {item.formula}</p>
                <p className="text-gray-300"><span className="text-gray-500">CAS Number:</span> {item.casNumber}</p>
                <p className="text-gray-300"><span className="text-gray-500">Purity:</span> {item.purity}</p>
                <p className="text-gray-300"><span className="text-gray-500">Supplier:</span> {item.supplier}</p>
                <p className="text-gray-300"><span className="text-gray-500">Stock:</span> {item.stock} {item.unit}</p>
                <p className="text-gray-300"><span className="text-gray-500">Harga:</span> {item.priceRange}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Hazards</h4>
                <div className="flex flex-wrap gap-2">
                  {item.hazards?.map(h => (
                    <span key={h} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">{h}</span>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === 'institutions' && (
            <>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300"><span className="text-gray-500">Tipe:</span> {item.type}</p>
                <p className="text-gray-300"><span className="text-gray-500">Lokasi:</span> {item.city}, {item.country}</p>
                <p className="text-gray-300"><span className="text-gray-500">Karyawan:</span> {item.employees?.toLocaleString()}</p>
                <p className="text-gray-300"><span className="text-gray-500">Budget:</span> {item.budget}</p>
                <p className="text-gray-300"><span className="text-gray-500">Publikasi:</span> {item.publications}+</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Fokus Riset</h4>
                <div className="flex flex-wrap gap-2">
                  {item.focus?.map(f => (
                    <span key={f} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">{f}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Fasilitas</h4>
                <ul className="list-disc list-inside text-sm text-gray-300">
                  {item.facilities?.map(f => <li key={f}>{f}</li>)}
                </ul>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onAskAI}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 rounded-xl text-white font-medium transition-colors"
            >
              Tanya AI tentang ini
            </button>
            <button className="px-4 py-2.5 bg-[#2f2f2f] hover:bg-[#3a3a3a] rounded-xl text-gray-300">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add/Edit Modal Component
const AddEditModal = ({ type, item, categories, countries, onClose, onSave }) => {
  const [formData, setFormData] = React.useState(item || {});

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const fields = {
    papers: ['title', 'authors', 'institution', 'journal', 'year', 'doi', 'abstract', 'keywords', 'citations', 'category', 'country'],
    equipment: ['name', 'manufacturer', 'model', 'category', 'location', 'status', 'priceRange', 'country'],
    materials: ['name', 'formula', 'casNumber', 'purity', 'supplier', 'stock', 'unit', 'category', 'priceRange', 'country'],
    institutions: ['name', 'type', 'city', 'country', 'employees', 'budget', 'publications']
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-xl max-h-[80vh] overflow-y-auto border border-[#2f2f2f]" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#1a1a1a] px-6 py-4 border-b border-[#2f2f2f] flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{item ? 'Edit' : 'Tambah'} Data</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields[type]?.map(field => (
            <div key={field}>
              <label className="block text-sm text-gray-400 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
              {field === 'category' || field === 'type' ? (
                <select
                  value={formData[field] || ''}
                  onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                  className="w-full bg-[#2f2f2f] text-white px-4 py-2 rounded-lg outline-none"
                >
                  <option value="">Pilih...</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              ) : field === 'country' ? (
                <select
                  value={formData[field] || ''}
                  onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                  className="w-full bg-[#2f2f2f] text-white px-4 py-2 rounded-lg outline-none"
                >
                  <option value="">Pilih...</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : field === 'abstract' ? (
                <textarea
                  value={formData[field] || ''}
                  onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                  className="w-full bg-[#2f2f2f] text-white px-4 py-2 rounded-lg outline-none h-24"
                />
              ) : field === 'authors' || field === 'keywords' ? (
                <input
                  type="text"
                  value={Array.isArray(formData[field]) ? formData[field].join(', ') : formData[field] || ''}
                  onChange={(e) => setFormData({...formData, [field]: e.target.value.split(',').map(s => s.trim())})}
                  placeholder="Pisahkan dengan koma"
                  className="w-full bg-[#2f2f2f] text-white px-4 py-2 rounded-lg outline-none"
                />
              ) : (
                <input
                  type={['year', 'citations', 'employees', 'publications', 'stock'].includes(field) ? 'number' : 'text'}
                  value={formData[field] || ''}
                  onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                  className="w-full bg-[#2f2f2f] text-white px-4 py-2 rounded-lg outline-none"
                />
              )}
            </div>
          ))}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[#2f2f2f] hover:bg-[#3a3a3a] rounded-xl text-gray-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl text-white font-medium"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RnDDatabase;
