import React from 'react';
import { LayoutGrid, MessageSquare, Newspaper, LogIn, ShieldAlert, LogOut, User, BarChart3 } from 'lucide-react';
import { AppView, UserProfile } from '../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  user: UserProfile | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, setView, isOpen, toggleSidebar, 
  user, onLoginClick, onLogoutClick 
}) => {
  const menuItems = [
    { id: AppView.HOME, label: 'Tool Directory', icon: LayoutGrid },
    { id: AppView.SMART_CHAT, label: 'Smart Chat', icon: MessageSquare },
    { id: AppView.LATEST_NEWS, label: 'Latest News', icon: Newspaper },
  ];

  const sidebarClasses = `fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out ${
    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
  }`;

  return (
    <>
       {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <div className={sidebarClasses}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
             <img 
               src="/android-chrome-512x512.png" 
               alt="AI News-Roll Logo" 
               className="w-10 h-10 rounded-lg"
             />
             <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
               AI News-Roll
             </span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-2">
              Platform
            </div>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  currentView === item.id
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                }`}
              >
                <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            
            {/* Admin Link - Only visible if user is admin */}
            {user?.role === 'admin' && (
              <>
                <div className="mt-8 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-2">
                  Management
                </div>
                <button
                    onClick={() => {
                      setView(AppView.ADMIN);
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      currentView === AppView.ADMIN
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                    }`}
                  >
                    <ShieldAlert className={`w-5 h-5 ${currentView === AppView.ADMIN ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                    <span className="font-medium">Admin Dashboard</span>
                  </button>
                <button
                    onClick={() => {
                      setView(AppView.ANALYTICS);
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      currentView === AppView.ANALYTICS
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                    }`}
                  >
                    <BarChart3 className={`w-5 h-5 ${currentView === AppView.ANALYTICS ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                    <span className="font-medium">Analytics</span>
                  </button>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-zinc-800 space-y-3">
             {user && (
                 <div className="flex items-center gap-3 px-2 mb-2">
                     <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                         <User className="w-4 h-4" />
                     </div>
                     <div className="flex-1 overflow-hidden">
                         <div className="text-sm font-medium text-white truncate">{user.email.split('@')[0]}</div>
                         <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">{user.role}</div>
                     </div>
                 </div>
             )}

             {user ? (
                 <button 
                  onClick={onLogoutClick}
                  className="w-full flex items-center justify-center gap-2 bg-red-900/10 hover:bg-red-900/30 text-red-400 py-2.5 rounded-lg transition-colors border border-red-900/20 font-medium"
                 >
                   <LogOut className="w-4 h-4" />
                   <span>Sign Out</span>
                 </button>
             ) : (
                <button 
                  onClick={onLoginClick}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-lg transition-colors border border-zinc-700 font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Up</span>
                </button>
             )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;