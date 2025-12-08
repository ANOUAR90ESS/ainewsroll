import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Sidebar from './components/Sidebar';
import ToolCard from './components/ToolCard';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import AdUnit from './components/AdUnit';

// Lazy load heavy components
const LiveDemo = lazy(() => import('./components/demos/LiveDemo'));
const SearchChat = lazy(() => import('./components/demos/SearchChat'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const NewsFeed = lazy(() => import('./components/demos/NewsFeed'));
const GenericPage = lazy(() => import('./components/GenericPage'));
const PaymentPage = lazy(() => import('./components/PaymentPage'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
import { AppView, Tool, NewsArticle, UserProfile } from './types';
import { generateDirectoryTools } from './services/geminiService';
import { 
  subscribeToTools, 
  subscribeToNews, 
  addToolToDb, 
  deleteToolFromDb, 
  updateToolInDb,
  addNewsToDb, 
  deleteNewsFromDb, 
  updateNewsInDb
} from './services/dbService';
import { Menu, Search, AlertCircle, Star, Zap, TrendingUp, Layers, Sparkles } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './services/supabase';
import { getCurrentUserProfile, signOut } from './services/authService';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-zinc-400 text-sm">Loading...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPageId, setCurrentPageId] = useState<string>('');
  
  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Data State
  const [tools, setTools] = useState<Tool[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dbError, setDbError] = useState(false);

  // Payment State
  const [selectedPlan, setSelectedPlan] = useState('Pro');

  // Check for API Key (AI Studio environment)
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isAIStudio, setIsAIStudio] = useState(false);

  // Update page title based on current view
  useEffect(() => {
    const titleMap: Record<AppView, string> = {
      [AppView.HOME]: 'AI Tool Directory | AI News-Roll',
      [AppView.SMART_CHAT]: 'Smart Chat | AI News-Roll',
      [AppView.LATEST_NEWS]: 'Latest News | AI News-Roll',
      [AppView.ANALYTICS]: 'Analytics Dashboard | AI News-Roll',
      [AppView.ADMIN]: 'Admin Dashboard | AI News-Roll',
      [AppView.PAGES]: 'Page | AI News-Roll',
      [AppView.PAYMENT]: 'Payment | AI News-Roll',
    };
    
    document.title = titleMap[currentView] || 'AI News-Roll';
  }, [currentView]);

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
       setDbError(true);
       checkApiKeyAndLoadLocal();
       return;
    }

    let authListener: any;
    let unsubscribeTools: () => void;
    let unsubscribeNews: () => void;

    const initializeApp = async () => {
      try {
        // First, check for existing session
        const { data: { session } } = await supabase!.auth.getSession();
        
        if (session) {
          // Restore user profile from existing session
          const profile = await getCurrentUserProfile();
          setUser(profile);
        }

        // Listen for Auth changes (Login/Logout)
        const { data } = supabase!.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth event:', event);
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            const profile = await getCurrentUserProfile();
            setUser(profile);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            // Reset to home view on signout (using functional update to avoid closure)
            setCurrentView(prev => prev === AppView.ADMIN ? AppView.HOME : prev);
          }
        });
        
        authListener = data;

        // Subscribe to Realtime Data
        unsubscribeTools = subscribeToTools((data) => {
          setTools(data);
        });

        unsubscribeNews = subscribeToNews((data) => {
          setNews(data);
        });

      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();

    // Check API Key for AI Studio features
    checkApiKeyAndLoadLocal();

    return () => {
      if (unsubscribeTools) unsubscribeTools();
      if (unsubscribeNews) unsubscribeNews();
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, []);

  const checkApiKeyAndLoadLocal = async () => {
      // Logic for AI Studio Env
      if (typeof window !== 'undefined' && window.aistudio && window.aistudio.hasSelectedApiKey) {
          setIsAIStudio(true);
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
          if (hasKey && !isSupabaseConfigured) {
              loadToolsLocally();
          }
      } else {
          // Normal env or fallback
          setHasApiKey(true); 
          if (!isSupabaseConfigured) loadToolsLocally();
      }
  };

  const loadToolsLocally = async () => {
    // Used for demo mode when DB is not connected
    try {
      const newTools = await generateDirectoryTools();
      setTools((prev: Tool[]) => [...prev, ...newTools]);
    } catch (e) {
      console.error("Failed to load tools", e);
    }
  };

  const handleAuthSuccess = async () => {
      const profile = await getCurrentUserProfile();
      setUser(profile);
  };

  const handleLogout = async () => {
      try {
          await signOut();
      } catch (e) {
          console.error("Logout failed", e);
      }
  };

  const handleNavigation = (view: AppView, pageId?: string) => {
      // Protect Admin View
      if (view === AppView.ADMIN && user?.role !== 'admin') {
          alert("Access Denied: Admins only.");
          return;
      }
      setCurrentView(view);
      if (pageId) setCurrentPageId(pageId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddTool = async (tool: Tool) => {
    try {
        if (isSupabaseConfigured) {
            await addToolToDb(tool);
        } else {
            setTools((prev: Tool[]) => [tool, ...prev]);
        }
    } catch (e: any) {
        console.error("Error adding tool", e);
        alert(`Failed to save tool: ${e.message}`);
    }
  };

  const handleUpdateTool = async (id: string, tool: Tool) => {
    try {
        if (isSupabaseConfigured) {
            await updateToolInDb(id, tool);
        } else {
            setTools((prev: Tool[]) => prev.map((t: Tool) => t.id === id ? { ...tool, id } : t));
        }
    } catch (e: any) {
        console.error("Error updating tool", e);
        alert(`Failed to update tool: ${e.message}`);
    }
  };

  const handleAddNews = async (article: NewsArticle) => {
    try {
        if (isSupabaseConfigured) {
            await addNewsToDb(article);
        } else {
            setNews((prev: NewsArticle[]) => [article, ...prev]);
        }
        setCurrentView(AppView.LATEST_NEWS);
    } catch (e: any) {
        console.error("Error adding news", e);
        alert(`Failed to save news: ${e.message}`);
    }
  };

  const handleUpdateNews = async (id: string, article: NewsArticle) => {
    try {
        if (isSupabaseConfigured) {
            await updateNewsInDb(id, article);
        } else {
            setNews((prev: NewsArticle[]) => prev.map((n: NewsArticle) => n.id === id ? { ...article, id } : n));
        }
    } catch (e: any) {
        console.error("Error updating news", e);
        alert(`Failed to update news: ${e.message}`);
    }
  };
  
  const handleDeleteTool = async (id: string) => {
    console.log("Deleting tool:", id);
    // Note: Confirmation UI is now handled in AdminDashboard via Modal
    
    // Optimistic Update
    const previousTools = [...tools];
    setTools((prev: Tool[]) => prev.filter((t: Tool) => t.id !== id));

    if (isSupabaseConfigured) {
        try {
            await deleteToolFromDb(id);
        } catch (error: any) {
            console.error("Delete failed:", error);
            alert(`Failed to delete tool from database: ${error.message}.`);
            setTools(previousTools); 
        }
    }
  };

  const handleDeleteNews = async (id: string) => {
    console.log("Deleting news:", id);
    // Note: Confirmation UI is now handled in AdminDashboard via Modal

    // Optimistic Update
    const previousNews = [...news];
    setNews((prev: NewsArticle[]) => prev.filter((n: NewsArticle) => n.id !== id));

    if (isSupabaseConfigured) {
        try {
            await deleteNewsFromDb(id);
        } catch (error: any) {
            console.error("Delete failed:", error);
            alert(`Failed to delete article from database: ${error.message}.`);
            setNews(previousNews);
        }
    }
  };

  // --- Collection Logic ---
  
  const collections = useMemo(() => {
    // Safe filter to avoid crashes on bad data
    const safeTools = tools.filter((t: Tool) => t && t.price && t.category);
    return {
      featured: safeTools.slice(0, 4),
      free: safeTools.filter((t: Tool) => (t.price || '').toLowerCase().includes('free') || (t.price || '').toLowerCase().includes('trial')).slice(0, 4),
      creative: safeTools.filter((t: Tool) => ['Image', 'Video', 'Audio', 'Writing'].includes(t.category)).slice(0, 4),
      productivity: safeTools.filter((t: Tool) => ['Coding', 'Business', 'Analytics'].includes(t.category)).slice(0, 4)
    };
  }, [tools]);

  const filteredTools = useMemo(() => {
     return tools.filter((tool: Tool) => {
        // Add safe navigation (|| '') to ensure we don't call toLowerCase on undefined
        const toolName = tool.name || '';
        const toolDesc = tool.description || '';
        const toolCat = tool.category || '';
        
        const matchesSearch = toolName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              toolDesc.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || toolCat.toLowerCase().includes(categoryFilter.toLowerCase());
        return matchesSearch && matchesCategory;
     });
  }, [tools, searchTerm, categoryFilter]);

  const categories = ['All', 'Writing', 'Image', 'Video', 'Audio', 'Coding', 'Business'];
  const showCollections = searchTerm === '' && categoryFilter === 'All';

  const CollectionSection = ({ title, icon: Icon, items, colorClass }: { title: string, icon: any, items: Tool[], colorClass: string }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-2">
           <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
             <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
           </div>
           <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        {/* Updated grid to 2 columns as requested for "two lines" effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((tool: Tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-black text-zinc-100">
      <Sidebar 
        currentView={currentView} 
        setView={handleNavigation} 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        user={user}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess}
      />

      <div className="flex-1 lg:ml-64 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-black/50 backdrop-blur-xl px-4 py-3 lg:px-8">
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="lg:hidden p-2 text-zinc-400 hover:text-white"
                  aria-label="Open sidebar menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div className="font-bold text-lg lg:hidden">Nexus AI</div>
            </div>

            <div className="flex-1 max-w-md mx-4">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search AI tools..." 
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setSearchTerm(e.target.value);
                          if (currentView !== AppView.HOME && e.target.value) setCurrentView(AppView.HOME);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm text-zinc-200 focus:bg-zinc-950 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {/* API Key Connect for AI Studio - Only show warning if missing */}
                {isAIStudio && !hasApiKey && (
                    <button 
                        onClick={async () => {
                            if (typeof window !== 'undefined' && window.aistudio) {
                                await window.aistudio.openSelectKey();
                                const has = await window.aistudio.hasSelectedApiKey();
                                setHasApiKey(has);
                            }
                        }}
                        className="text-xs bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                    >
                        <AlertCircle className="w-3 h-3" /> Connect Key
                    </button>
                )}
                {/* Removed persistent 'API Key' button to reduce user anxiety as requested */}
            </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-zinc-950/50 scroll-smooth">
          <div className="p-4 lg:p-8 min-h-full flex flex-col">
            {dbError && (
                <div className="bg-emerald-900/20 border border-emerald-800 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-emerald-400 font-bold text-sm">Connect Supabase</h4>
                        <p className="text-emerald-200/70 text-sm mt-1">
                            To save data to the cloud, update <code className="bg-black/30 px-1 rounded">services/supabase.ts</code> with your project credentials.
                        </p>
                    </div>
                </div>
            )}
            
            {/* Show Ad Banner on Home and News */}
            {(currentView === AppView.HOME || currentView === AppView.LATEST_NEWS) && (
                <div className="mb-6 flex justify-center">
                    <AdUnit format="horizontal" />
                </div>
            )}
            
            <div className="flex-1">
              {currentView === AppView.HOME && (
                <div className="space-y-8 max-w-7xl mx-auto">
                  <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-zinc-800 pb-8">
                    <div>
                      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
                        AI Tool Directory
                      </h1>
                      <p className="text-zinc-400">Discover next-gen tools generated by Gemini.</p>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                          categoryFilter === cat 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Content Switcher: Collections vs Grid */}
                  {showCollections ? (
                    <div className="space-y-16">
                      <CollectionSection 
                        title="Featured Picks" 
                        icon={Star} 
                        items={collections.featured} 
                        colorClass="bg-yellow-500 text-yellow-500" 
                      />
                      
                      {/* Ad Between Sections */}
                      <div className="flex justify-center">
                        <AdUnit format="horizontal" />
                      </div>
                      
                      <CollectionSection 
                        title="Top Free & Freemium" 
                        icon={Zap} 
                        items={collections.free} 
                        colorClass="bg-emerald-500 text-emerald-500" 
                      />

                      {/* Ad Between Sections */}
                      <div className="flex justify-center">
                        <AdUnit format="horizontal" />
                      </div>

                      <CollectionSection 
                        title="Trending Creative Tools" 
                        icon={Sparkles} 
                        items={collections.creative} 
                        colorClass="bg-pink-500 text-pink-500" 
                      />

                      {/* Ad Between Sections */}
                      <div className="flex justify-center">
                        <AdUnit format="horizontal" />
                      </div>

                       <CollectionSection 
                        title="Productivity & Code" 
                        icon={Layers} 
                        items={collections.productivity} 
                        colorClass="bg-blue-500 text-blue-500" 
                      />
                      
                      {tools.length === 0 && (
                        <div className="text-center py-20 text-zinc-500">
                           <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                           <p>No tools found. Add some via the Admin Dashboard!</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                       <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                         <Search className="w-4 h-4 text-indigo-400" />
                         Search Results ({filteredTools.length})
                       </h2>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                          {filteredTools.map((tool: Tool) => (
                            <ToolCard key={tool.id} tool={tool} />
                          ))}
                          {filteredTools.length === 0 && (
                             <div className="col-span-full text-center py-12 text-zinc-500">
                               No tools found matching your criteria.
                             </div>
                          )}
                       </div>
                    </div>
                  )}

                </div>
              )}

              {currentView === AppView.SMART_CHAT && (
                <Suspense fallback={<LoadingFallback />}>
                  <SearchChat />
                </Suspense>
              )}
              {currentView === AppView.LATEST_NEWS && (
                <Suspense fallback={<LoadingFallback />}>
                  <NewsFeed articles={news} />
                </Suspense>
              )}
              {currentView === AppView.ANALYTICS && (
                <Suspense fallback={<LoadingFallback />}>
                  <AnalyticsDashboard />
                </Suspense>
              )}
              {currentView === AppView.PAYMENT && (
                <Suspense fallback={<LoadingFallback />}>
                  <PaymentPage 
                      plan={selectedPlan} 
                      onBack={() => setCurrentView(AppView.HOME)}
                      onComplete={() => setCurrentView(AppView.HOME)} 
                  />
                </Suspense>
              )}
              {currentView === AppView.ADMIN && (
                <Suspense fallback={<LoadingFallback />}>
                  <AdminDashboard 
                      tools={tools} 
                      news={news}
                      user={user}
                      onAddTool={handleAddTool} 
                      onUpdateTool={handleUpdateTool}
                      onAddNews={handleAddNews} 
                      onUpdateNews={handleUpdateNews}
                      onDeleteTool={handleDeleteTool}
                      onDeleteNews={handleDeleteNews}
                      onBack={() => setCurrentView(AppView.HOME)}
                  />
                </Suspense>
              )}
              {currentView === AppView.PAGES && (
                <Suspense fallback={<LoadingFallback />}>
                  <GenericPage pageId={currentPageId} onBack={() => setCurrentView(AppView.HOME)} />
                </Suspense>
              )}
            </div>

            <Footer onNavigate={handleNavigation} />
          </div>
        </main>
      </div>
      <SpeedInsights />
    </div>
  );
};

export default App;