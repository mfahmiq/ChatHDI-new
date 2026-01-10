import React from 'react';
import {
  Plus, MessageSquare, MoreHorizontal, Pencil, Trash2, Menu, X,
  FolderOpen, Folder, ChevronDown, ChevronRight, Pin, Search,
  Settings, Star, Archive, FolderPlus, Hash, Sparkles, Download,
  CheckCircle, Clock, Zap, ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';

const Sidebar = ({
  projects,
  conversations,
  activeConversation,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  onCreateProject,
  onMoveToProject,
  activeProject,
  onSelectProject,
  isMobileOpen,
  onCloseMobile
}) => {
  const [editingId, setEditingId] = React.useState(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [expandedProjects, setExpandedProjects] = React.useState(['proj-1', 'proj-2', 'proj-3']);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showNewProject, setShowNewProject] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState('');
  const [showUpdateModal, setShowUpdateModal] = React.useState(false);

  const toggleProject = (projectId) => {
    setExpandedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const projectId = `proj-${Date.now()}`;
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProject(false);
      // Expand the new project
      setExpandedProjects(prev => [...prev, projectId]);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(c => c.isPinned);
  const projectConversations = (projectId) =>
    filteredConversations.filter(c => c.projectId === projectId && !c.isPinned);
  const unorganizedConversations = filteredConversations.filter(c => !c.projectId && !c.isPinned);

  const handleStartEdit = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = (id) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const ConversationItem = ({ conv }) => (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 ml-2',
        activeConversation?.id === conv.id
          ? 'bg-[#2f2f2f]'
          : 'hover:bg-[#2f2f2f]/50'
      )}
      onClick={() => {
        onSelectConversation(conv);
        onCloseMobile?.();
      }}
    >
      <MessageSquare className="h-4 w-4 shrink-0 text-gray-500" />

      {editingId === conv.id ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => handleSaveEdit(conv.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveEdit(conv.id);
            if (e.key === 'Escape') setEditingId(null);
          }}
          className="flex-1 bg-[#40414f] text-white text-sm px-2 py-1 rounded outline-none border border-[#565869]"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate text-sm text-gray-300">
          {conv.title}
        </span>
      )}

      {conv.isPinned && <Pin className="h-3 w-3 text-yellow-500 shrink-0" />}

      {editingId !== conv.id && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePin(conv.id); }}
            className="p-1 hover:bg-[#40414f] rounded text-gray-400 hover:text-yellow-500"
            title={conv.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => handleStartEdit(conv, e)}
            className="p-1 hover:bg-[#40414f] rounded text-gray-400 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }}
            className="p-1 hover:bg-[#40414f] rounded text-gray-400 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onCloseMobile} />
      )}

      <aside className={cn(
        'fixed md:relative inset-y-0 left-0 z-50 w-[280px] bg-[#171717] flex flex-col transition-transform duration-300 md:translate-x-0 border-r border-[#2f2f2f]',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/icons/logo-hdi.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-semibold text-white">ChatHDI</span>
            </div>
            <button className="md:hidden p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-400" onClick={onCloseMobile}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" />
            Chat Baru
          </button>

          {activeProject && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400">
              <Folder className="h-3.5 w-3.5" />
              <span className="truncate">
                Chat baru di: {projects.find(p => p.id === activeProject)?.name}
              </span>
              <button
                onClick={() => onSelectProject(null)}
                className="ml-auto hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#2f2f2f] text-white text-sm pl-9 pr-3 py-2 rounded-lg outline-none border border-transparent focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-thin scrollbar-thumb-[#565869]">
          {/* Pinned */}
          {pinnedConversations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Star className="h-3.5 w-3.5" />
                Disematkan
              </div>
              {pinnedConversations.map(conv => <ConversationItem key={conv.id} conv={conv} />)}
            </div>
          )}

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <FolderOpen className="h-3.5 w-3.5" />
                Projects
              </span>
              <button
                onClick={() => setShowNewProject(true)}
                className="p-1 hover:bg-[#2f2f2f] rounded text-gray-500 hover:text-emerald-500"
                title="New Project"
              >
                <FolderPlus className="h-4 w-4" />
              </button>
            </div>

            {showNewProject && (
              <div className="mx-2 mb-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Nama project..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateProject();
                    if (e.key === 'Escape') setShowNewProject(false);
                  }}
                  className="flex-1 bg-[#2f2f2f] text-white text-sm px-3 py-1.5 rounded-lg outline-none border border-emerald-500/50"
                  autoFocus
                />
                <button
                  onClick={handleCreateProject}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-500"
                >
                  Buat
                </button>
              </div>
            )}

            {projects.map(project => (
              <div key={project.id} className="mb-1">
                <div className="flex items-center">
                  <button
                    onClick={() => toggleProject(project.id)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    {expandedProjects.includes(project.id)
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />
                    }
                  </button>
                  <button
                    onClick={() => {
                      onSelectProject(activeProject === project.id ? null : project.id);
                      if (!expandedProjects.includes(project.id)) {
                        toggleProject(project.id);
                      }
                    }}
                    className={cn(
                      'flex-1 flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors',
                      activeProject === project.id
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-gray-400 hover:bg-[#2f2f2f]/50 hover:text-white'
                    )}
                  >
                    <span className="text-lg">{project.icon}</span>
                    <span className="flex-1 text-left truncate">{project.name}</span>
                    <span className="text-xs text-gray-500 bg-[#2f2f2f] px-1.5 py-0.5 rounded">
                      {projectConversations(project.id).length}
                    </span>
                  </button>
                </div>

                {expandedProjects.includes(project.id) && (
                  <div className="mt-1 space-y-0.5">
                    {projectConversations(project.id).length === 0 ? (
                      <div className="ml-8 text-xs text-gray-500 py-2 px-3 italic">
                        Belum ada chat. Klik project lalu "Chat Baru"
                      </div>
                    ) : (
                      projectConversations(project.id).map(conv => (
                        <ConversationItem key={conv.id} conv={conv} />
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Unorganized */}
          {unorganizedConversations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Archive className="h-3.5 w-3.5" />
                Lainnya
              </div>
              {unorganizedConversations.map(conv => <ConversationItem key={conv.id} conv={conv} />)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#2f2f2f] p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[#2f2f2f] transition-colors cursor-pointer">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
              U
            </div>
            <div className="flex-1">
              <div className="text-sm text-white font-medium">User Pro</div>
              <div className="text-xs text-emerald-500">HDI-4 Active</div>
            </div>
            <button
              onClick={() => setShowUpdateModal(true)}
              className="p-1 rounded-lg hover:bg-[#3a3a3a] transition-colors"
            >
              <Settings className="h-5 w-5 text-gray-500 hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </aside>

      {/* Update Version Modal */}
      {showUpdateModal && (
        <UpdateVersionModal onClose={() => setShowUpdateModal(false)} />
      )}
    </>
  );
};


// Update Version Modal Component
const UpdateVersionModal = ({ onClose }) => {
  const currentVersion = "2.1.0";
  const latestVersion = "2.2.0";
  const isUpToDate = currentVersion === latestVersion;

  const updateHistory = [
    {
      version: "2.2.0",
      date: "24 Dec 2024",
      isLatest: true,
      changes: [
        "Fitur Generate PPTX Presentasi",
        "R&D Database dengan Sync Real-time",
        "Mode Admin untuk CRUD Database",
        "Peningkatan UI/UX"
      ]
    },
    {
      version: "2.1.0",
      date: "23 Dec 2024",
      isLatest: false,
      changes: [
        "Integrasi Image Generation (Nano Banana)",
        "Video Generation (Veo 3.0, Sora 2)",
        "Project Folders untuk organisasi chat",
        "Tombol fitur di Welcome Screen"
      ]
    },
    {
      version: "2.0.0",
      date: "22 Dec 2024",
      isLatest: false,
      changes: [
        "Integrasi AI Real (GPT-4o, Claude)",
        "Multi-model Support",
        "Canvas untuk kode",
        "R&D Database (Mock)"
      ]
    },
    {
      version: "1.0.0",
      date: "21 Dec 2024",
      isLatest: false,
      changes: [
        "Rilis awal ChatHDI",
        "UI seperti ChatGPT",
        "Sidebar dengan history",
        "Dark theme"
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden border border-[#2f2f2f] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-[#2f2f2f] bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 hover:bg-[#2f2f2f] rounded-lg text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 flex items-center justify-center shadow-lg shadow-emerald-500/10 border border-emerald-500/20 p-2">
              <img src="/icons/logo-hdi.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ChatHDI Update</h2>
              <p className="text-sm text-gray-400">Versi saat ini: <span className="text-emerald-400 font-medium">{currentVersion}</span></p>
            </div>
          </div>
        </div>

        {/* Update Status */}
        <div className="px-6 py-4 border-b border-[#2f2f2f]">
          {isUpToDate ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
              <div>
                <p className="text-emerald-400 font-medium">Anda menggunakan versi terbaru!</p>
                <p className="text-xs text-gray-400">ChatHDI v{currentVersion}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <Sparkles className="h-6 w-6 text-amber-500" />
                <div className="flex-1">
                  <p className="text-amber-400 font-medium">Update tersedia!</p>
                  <p className="text-xs text-gray-400">Versi {latestVersion} sudah dirilis</p>
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl text-white font-medium transition-colors">
                <Download className="h-5 w-5" />
                Update Sekarang
              </button>
            </div>
          )}
        </div>

        {/* Version History */}
        <div className="px-6 py-4 overflow-y-auto max-h-[400px]">
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Riwayat Update
          </h3>
          <div className="space-y-4">
            {updateHistory.map((release, index) => (
              <div
                key={release.version}
                className={cn(
                  "relative pl-6 pb-4",
                  index < updateHistory.length - 1 && "border-l border-[#2f2f2f]"
                )}
              >
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-0 top-0 w-3 h-3 rounded-full -translate-x-1.5",
                  release.isLatest
                    ? "bg-emerald-500 ring-4 ring-emerald-500/20"
                    : "bg-[#3a3a3a]"
                )} />

                {/* Version info */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-sm font-bold",
                    release.isLatest ? "text-emerald-400" : "text-white"
                  )}>
                    v{release.version}
                  </span>
                  {release.isLatest && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium">
                      TERBARU
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{release.date}</span>
                </div>

                {/* Changes */}
                <ul className="space-y-1">
                  {release.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <Zap className="h-3.5 w-3.5 text-gray-600 mt-0.5 shrink-0" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2f2f2f] bg-[#171717]">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>© 2024 HDI - Hydrogen Development Indonesia</span>
            <a href="#" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
              Lihat changelog lengkap
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
