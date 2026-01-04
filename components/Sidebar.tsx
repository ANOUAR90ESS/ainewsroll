import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, MessageSquare, Newspaper, LogIn, ShieldAlert, LogOut, User, BarChart3, Heart, DollarSign, Sparkles, Clock, BookOpen } from 'lucide-react';
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
  isOpen, toggleSidebar,
  user, onLoginClick, onLogoutClick
}) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'All Tools', icon: LayoutGrid },
    { path: '/tools/free', label: 'Free Tools', icon: Sparkles },
    { path: '/tools/paid', label: 'Paid Tools', icon: DollarSign },
    { path: '/tools/latest', label: 'Latest Tools', icon: Clock },
    { path: '/news', label: 'Latest News', icon: Newspaper },
    { path: '/courses', label: 'AI Courses', icon: BookOpen },
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
               src="/logo.webp" 
               alt="AI News-Roll Logo" 
               width="40"
               height="40"
               className="w-10 h-10 rounded-lg"
               loading="eager"
             />
             <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
               AI News-Roll
             </span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-2">
              Platform
            </div>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* My Favorites - Only visible if user is logged in */}
            {user && (
              <>
                <div className="mt-8 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-2">
                  Personal
                </div>
                <Link
                  to="/favorites"
                  onClick={() => {
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    location.pathname === '/favorites'
                      ? 'bg-red-600/10 text-red-400 border border-red-600/20'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${location.pathname === '/favorites' ? 'text-red-400 fill-current' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  <span className="font-medium">My Favorites</span>
                </Link>
              </>
            )}

            {/* Admin Link - Only visible if user is admin */}
            {user?.role === 'admin' && (
              <>
                <div className="mt-8 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-2">
                  Management
                </div>
                <Link
                    to="/admin"
                    onClick={() => {
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      location.pathname === '/admin'
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                    }`}
                  >
                    <ShieldAlert className={`w-5 h-5 ${location.pathname === '/admin' ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                    <span className="font-medium">Admin Dashboard</span>
                  </Link>
                <Link
                    to="/analytics"
                    onClick={() => {
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      location.pathname === '/analytics'
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                    }`}
                  >
                    <BarChart3 className={`w-5 h-5 ${location.pathname === '/analytics' ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                    <span className="font-medium">Analytics</span>
                  </Link>
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
                  type="button"
                  onClick={onLogoutClick}
                  className="w-full flex items-center justify-center gap-2 bg-red-900/10 hover:bg-red-900/30 text-red-400 py-2.5 rounded-lg transition-colors border border-red-900/20 font-medium"
                 >
                   <LogOut className="w-4 h-4" />
                   <span>Sign Out</span>
                 </button>
             ) : (
                <button
                  type="button"
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