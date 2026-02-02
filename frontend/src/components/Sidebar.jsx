import React from 'react';
import {
  Plus, MessageSquare, MoreHorizontal, Pencil, Trash2, Menu, X,
  FolderOpen, Folder, ChevronDown, ChevronRight, Pin, Search,
  Settings, Star, Archive, FolderPlus, Hash, Sparkles, Download,
  CheckCircle, Clock, Zap, ArrowRight, LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import SettingsModal from './SettingsModal';

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
  onDeleteProject,
  onMoveToProject,
  activeProject,
  onSelectProject,
  isMobileOpen,
  onCloseMobile
}) => {
  const { user, logout } = useAuth();
  const [editingId, setEditingId] = React.useState(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [expandedProjects, setExpandedProjects] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showNewProject, setShowNewProject] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState('');
  const [showUpdateModal, setShowUpdateModal] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [showProjectMenu, setShowProjectMenu] = React.useState(null);

  // Initialize expanded projects
  React.useEffect(() => {
    if (projects && projects.length > 0) {
      setExpandedProjects(projects.map(p => p.id));
    }
  }, [projects]);

  // Reset error when user changes
  React.useEffect(() => {
    setImageError(false);
  }, [user]);

  const avatarUrl = !imageError && (user?.user_metadata?.avatar_url || user?.user_metadata?.picture)
    ? (user?.user_metadata?.avatar_url || user?.user_metadata?.picture)
    : `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || user?.email || 'User'}&background=random&color=fff`;

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

  const filteredConversations = conversations.filter(conv => {
    const query = searchQuery.toLowerCase();
    const titleMatch = conv.title?.toLowerCase().includes(query);
    const contentMatch = conv.messages?.some(msg =>
      msg.content?.toLowerCase().includes(query)
    );
    return titleMatch || contentMatch;
  });

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

  const handleMoveClick = (convId, projectId) => {
    onMoveToProject(convId, projectId);
    setShowProjectMenu(null);
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
          {/* Move to Project Trigger */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowProjectMenu(showProjectMenu === conv.id ? null : conv.id); }}
              className="p-1 hover:bg-[#40414f] rounded text-gray-400 hover:text-white"
              title="Move to Project"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>

            {showProjectMenu === conv.id && (
              <div className="absolute right-0 top-6 w-40 bg-[#1e1e1e] border border-[#2f2f2f] rounded-lg shadow-xl z-50 py-1">
                <div className="px-2 py-1 text-xs text-gray-500 uppercase">Pindah ke...</div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoveClick(conv.id, null); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-[#2f2f2f] flex items-center gap-2"
                >
                  <Archive className="h-3 w-3" /> Lainnya (Unorganized)
                </button>
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={(e) => { e.stopPropagation(); handleMoveClick(conv.id, p.id); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-[#2f2f2f] flex items-center gap-2"
                  >
                    <Folder className="h-3 w-3" /> {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

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
                <img src="logo-hdi.png" alt="Logo" className="w-full h-full object-contain" />
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
              <div key={project.id} className="mb-1 group">
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
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteProject && onDeleteProject(project.id); }}
                    className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Project"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[#2f2f2f] transition-colors group">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 p-[2px]">
              <div className="h-full w-full rounded-full bg-[#171717] flex items-center justify-center overflow-hidden">
                <img
                  src={avatarUrl}
                  alt="User"
                  className="h-full w-full object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white font-medium truncate">
                {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-xs text-emerald-500 truncate">{user?.email || 'Guest'}</div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setShowUpdateModal(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#3a3a3a] transition-colors ml-1"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Settings Modal - Replaces UpdateVersionModal */}
      {showUpdateModal && (
        <SettingsModal
          onClose={() => setShowUpdateModal(false)}
          conversations={conversations}
          setConversations={(convs) => {
            // Callback to update parent state if conversations are cleared
            // We need a way to propagate this up to ChatPage
            // Since Sidebar props don't have setConversations directly but we can reload page or use a prop if available.
            // Actually, Sidebar receives `conversations` map, but maybe safer to just reload window or handle it via a new prop?
            // For now let's just close modal. The actual clearance happens in backend.
            // Ideally we need onConversationsChange prop.
            window.location.reload(); // Simple brute force update for "Clear All"
          }}
          setActiveConversation={onSelectConversation}
        />
      )}
    </>
  );
};




export default Sidebar;
