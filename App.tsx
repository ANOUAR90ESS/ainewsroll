import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Sidebar from './components/Sidebar';
import ToolCard from './components/ToolCard';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import AdUnit from './components/AdUnit';
import SEO from './components/SEO';
import { useGA4, trackPageView, trackCategoryView, trackToolVisit, trackToolDetailView, trackFavoriteConversion } from './services/analyticsService';

// Lazy load heavy components
const LiveDemo = lazy(() => import('./components/demos/LiveDemo'));
const SearchChat = lazy(() => import('./components/demos/SearchChat'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const NewsFeed = lazy(() => import('./components/demos/NewsFeed'));
const GenericPage = lazy(() => import('./components/GenericPage'));
const PaymentPage = lazy(() => import('./components/PaymentPage'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const FavoritesPage = lazy(() => import('./components/FavoritesPage'));
const ToolDetail = lazy(() => import('./components/ToolDetail'));
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
  updateNewsInDb,
  subscribeToFavorites,
  addFavorite,
  removeFavorite
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
  const location = useLocation();
  const navigate = useNavigate();
  useGA4();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPageId, setCurrentPageId] = useState<string>('');

  // Map URL path to AppView
  const pathToView = (pathname: string): AppView => {
    if (pathname.startsWith('/tool/')) return AppView.TOOL_DETAIL;
    if (pathname.startsWith('/category/')) return AppView.CATEGORY;
    if (pathname === '/' || pathname === '/directory') return AppView.HOME;
    if (pathname === '/chat') return AppView.SMART_CHAT;
    if (pathname === '/news') return AppView.LATEST_NEWS;
    if (pathname === '/analytics') return AppView.ANALYTICS;
    if (pathname === '/admin') return AppView.ADMIN;
    if (pathname === '/payment') return AppView.PAYMENT;
    if (pathname === '/favorites') return AppView.FAVORITES;
    if (pathname.startsWith('/page/')) return AppView.PAGES;
    return AppView.HOME;
  };

  const currentView = pathToView(location.pathname);
  
  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Data State
  const [tools, setTools] = useState<Tool[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dbError, setDbError] = useState(false);

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

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
      [AppView.FAVORITES]: 'My Favorites | AI News-Roll',
      [AppView.CATEGORY]: 'Category | AI News-Roll',
      [AppView.TOOL_DETAIL]: 'Tool Detail | AI News-Roll'
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
            // Reset to home view on signout
            if (window.location.pathname === '/admin' || window.location.pathname === '/analytics') {
              navigate('/');
            }
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
          setFavoriteIds([]); // Clear favorites on logout
      } catch (e) {
          console.error("Logout failed", e);
      }
  };

  // Subscribe to user favorites when logged in
  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setFavoriteIds([]);
      return;
    }

    const unsubscribe = subscribeToFavorites(user.id, (favoriteToolIds) => {
      setFavoriteIds(favoriteToolIds);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, isSupabaseConfigured]);

  const handleToggleFavorite = async (toolId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const isFavorite = favoriteIds.includes(toolId);
      if (isFavorite) {
        await removeFavorite(user.id, toolId);
      } else {
        await addFavorite(user.id, toolId);
        const tool = tools.find((t) => t.id === toolId);
        if (tool) {
          trackFavoriteConversion(tool.name, tool.category);
        }
      }
    } catch (e: any) {
      console.error("Error toggling favorite:", e);
      alert(`Failed to ${favoriteIds.includes(toolId) ? 'remove' : 'add'} favorite: ${e.message}`);
    }
  };

  const handleCategorySelect = (cat: string) => {
    setCategoryFilter(cat);
    if (cat === 'All') {
      navigate('/');
    } else {
      navigate(`/category/${slugifyCategory(cat)}`);
    }
    trackCategoryView(cat, categoryCounts[cat] || 0);
  };

  const handleNavigation = (view: AppView, pageId?: string) => {
      // Protect Admin View
      if (view === AppView.ADMIN && user?.role !== 'admin') {
          alert("Access Denied: Admins only.");
          return;
      }
      if (view === AppView.ANALYTICS && user?.role !== 'admin') {
        alert("Access Denied: Admins only.");
        return;
      }

      // Map AppView to URL path
      const viewToPath: Record<AppView, string> = {
        [AppView.HOME]: '/',
        [AppView.SMART_CHAT]: '/chat',
        [AppView.LATEST_NEWS]: '/news',
        [AppView.ANALYTICS]: '/analytics',
        [AppView.ADMIN]: '/admin',
        [AppView.PAYMENT]: '/payment',
        [AppView.FAVORITES]: '/favorites',
        [AppView.PAGES]: pageId ? `/page/${pageId}` : '/pages',
        [AppView.CATEGORY]: '/',
        [AppView.TOOL_DETAIL]: '/'
      };

      navigate(viewToPath[view]);
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
    console.log('handleAddNews called with:', article);
    console.log('isSupabaseConfigured:', isSupabaseConfigured);

    try {
        if (isSupabaseConfigured) {
            console.log('Attempting to save news to Supabase...');
            await addNewsToDb(article);
            console.log('News saved to Supabase successfully');
        } else {
            console.log('Supabase not configured, saving to local state');
            setNews((prev: NewsArticle[]) => [article, ...prev]);
        }
        navigate('/news');
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
      featured: safeTools.slice(0, 20), // Show up to 20 featured tools
      free: safeTools.filter((t: Tool) => (t.price || '').toLowerCase().includes('free') || (t.price || '').toLowerCase().includes('trial')).slice(0, 20),
      creative: safeTools.filter((t: Tool) => ['Image', 'Video', 'Audio', 'Writing'].includes(t.category)).slice(0, 20),
      productivity: safeTools.filter((t: Tool) => ['Coding', 'Business', 'Analytics'].includes(t.category)).slice(0, 20)
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

  // Tools visible with infinite scroll
  const visibleTools = useMemo(() => {
    return filteredTools.slice(0, visibleCount);
  }, [filteredTools, visibleCount]);

  const hasMore = visibleCount < filteredTools.length;

  const categories = useMemo(() => ['All', 'Writing', 'Image', 'Video', 'Audio', 'Coding', 'Business', 'Data Analysis', 'Education', 'Healthcare', 'Design'], []);

  const slugifyCategory = (cat: string) => cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const unslugCategory = useCallback((slug: string) => categories.find(cat => slugifyCategory(cat) === slug) || '', [categories]);

  const toolIdFromPath = useMemo(() => {
    const match = location.pathname.match(/^\/tool\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const categorySlugFromPath = useMemo(() => {
    const match = location.pathname.match(/^\/category\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const selectedTool = useMemo(() => {
    if (!toolIdFromPath) return null;
    return tools.find((t: Tool) => t.id === toolIdFromPath) || null;
  }, [toolIdFromPath, tools]);

  const categoryCounts = useMemo(() => {
    return tools.reduce((acc, tool) => {
      if (tool?.category) {
        acc[tool.category] = (acc[tool.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [tools]);

  const showCollections = searchTerm === '' && categoryFilter === 'All';

  // SEO metadata based on current view
  const seoProps = useMemo(() => {
    const baseUrl = 'https://ainewsroll.space';

    switch (currentView) {
      case AppView.TOOL_DETAIL:
        return {
          title: selectedTool ? `${selectedTool.name} | AI Tool Profile | AI News-Roll` : 'AI Tool Profile | AI News-Roll',
          description: selectedTool ? selectedTool.description : 'Explore full details about this AI tool in the AI News-Roll directory.',
          keywords: selectedTool ? `${selectedTool.name}, ${selectedTool.category} AI tool, AI software` : 'AI tool profile, AI News-Roll',
          canonical: `${baseUrl}${location.pathname}`,
          ogType: 'article',
          ogImage: selectedTool?.imageUrl || undefined
        };

      case AppView.CATEGORY:
        return {
          title: `${categoryFilter} AI Tools | ${categoryCounts[categoryFilter] || 0} listings | AI News-Roll`,
          description: `Browse ${categoryCounts[categoryFilter] || 0} vetted ${categoryFilter} AI tools with screenshots, pricing, and key features. Updated daily on AI News-Roll.`,
          keywords: `${categoryFilter} AI tools, ${categoryFilter.toLowerCase()} software, AI News-Roll directory`,
          canonical: `${baseUrl}/category/${slugifyCategory(categoryFilter)}`,
          ogType: 'website'
        };
      case AppView.HOME:
        return {
          title: 'AI Tool Directory | Discover 50+ AI-Powered Tools | AI News-Roll',
          description: `Explore ${tools.length}+ cutting-edge AI tools across ${categories.length - 1} categories. Find the perfect AI solution for writing, image generation, video creation, coding, and more.`,
          keywords: 'AI tools directory, artificial intelligence tools, AI-powered software, generative AI, machine learning tools, AI productivity',
          canonical: baseUrl,
          ogType: 'website'
        };

      case AppView.SMART_CHAT:
        return {
          title: 'Smart Chat with Gemini | AI News-Roll',
          description: 'Chat with Gemini AI powered by Google Search and Maps. Get real-time information and grounded answers.',
          keywords: 'AI chat, Gemini AI, Google search AI, AI assistant, conversational AI',
          canonical: `${baseUrl}/chat`,
          ogType: 'website'
        };

      case AppView.LATEST_NEWS:
        return {
          title: `Latest AI News | ${news.length}+ Articles | AI News-Roll`,
          description: 'Stay updated with breaking AI news, latest developments in artificial intelligence, machine learning breakthroughs, and tech innovations.',
          keywords: 'AI news, artificial intelligence news, machine learning news, AI updates, tech news',
          canonical: `${baseUrl}/news`,
          ogType: 'website'
        };

      case AppView.FAVORITES:
        return {
          title: `My Favorites | ${favoriteIds.length} Saved Tools | AI News-Roll`,
          description: 'Your personalized collection of favorite AI tools. Quick access to the tools you love.',
          keywords: 'AI tools favorites, saved tools, bookmarked AI tools',
          canonical: `${baseUrl}/favorites`,
          ogType: 'website'
        };

      default:
        return {
          title: 'AI Tool Directory | AI News-Roll',
          description: 'Discover the latest AI tools and breaking AI news.',
          keywords: 'AI tools, artificial intelligence, AI news',
          canonical: baseUrl,
          ogType: 'website'
        };
    }
  }, [currentView, tools.length, news.length, favoriteIds.length, categories.length, selectedTool?.id, selectedTool?.imageUrl, categoryFilter, categoryCounts[categoryFilter], location.pathname]);

  useEffect(() => {
    trackPageView(seoProps.title, location.pathname);
  }, [location.pathname, seoProps.title]);

  useEffect(() => {
    if (currentView === AppView.TOOL_DETAIL && selectedTool) {
      trackToolDetailView(selectedTool.name, selectedTool.category);
    }
  }, [currentView, selectedTool]);

  // Infinite Scroll Effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore) {
          setVisibleCount((prev) => prev + 12);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore]);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, categoryFilter]);

  // Sync category from URL and track popularity
  useEffect(() => {
    if (categorySlugFromPath) {
      const catName = unslugCategory(categorySlugFromPath);
      if (catName && catName !== categoryFilter) {
        setCategoryFilter(catName);
        trackCategoryView(catName, categoryCounts[catName] || 0);
      } else if (!catName) {
        setCategoryFilter('All');
      }
    } else if (location.pathname === '/' && categoryFilter !== 'All') {
      setCategoryFilter('All');
    }
  }, [categorySlugFromPath, categoryFilter, location.pathname, categoryCounts, unslugCategory]);

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
        {/* Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((tool: Tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isFavorite={favoriteIds.includes(tool.id)}
              isAuthenticated={!!user}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-black text-zinc-100">
      {/* Dynamic SEO Meta Tags */}
      <SEO {...seoProps} />

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
                <div className="font-bold text-lg lg:hidden">AI News-Roll</div>
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
                          if (currentView !== AppView.HOME && e.target.value) navigate('/');
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
              {currentView === AppView.TOOL_DETAIL && (
                <Suspense fallback={<LoadingFallback />}>
                  <ToolDetail 
                    tool={selectedTool}
                    onBack={() => navigate('/')}
                    onVisitWebsite={(url) => {
                      if (selectedTool) {
                        trackToolVisit(selectedTool.name, selectedTool.category, url);
                      }
                    }}
                  />
                </Suspense>
              )}

              {(currentView === AppView.HOME || currentView === AppView.CATEGORY) && (
                <div className="space-y-8 max-w-7xl mx-auto">
                  <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-zinc-800 pb-8">
                    <div>
                      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
                        AI Tool Directory
                      </h1>
                      <p className="text-zinc-400">Discover next-gen tools generated by Gemini.</p>
                    </div>
                  </div>

                  {/* Category Tabs */}
                  <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-1">
                      {categories.map(cat => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => handleCategorySelect(cat)}
                          className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                            categoryFilter === cat
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
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
                    <div className="space-y-6">
                       <div className="flex items-center justify-between">
                         <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                           <Search className="w-4 h-4 text-indigo-400" />
                           {categoryFilter === 'All' ? 'All Tools' : categoryFilter} ({filteredTools.length})
                         </h2>
                         {visibleCount < filteredTools.length && (
                           <span className="text-sm text-zinc-500">
                             Showing {visibleCount} of {filteredTools.length}
                           </span>
                         )}
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                          {visibleTools.map((tool: Tool) => (
                            <ToolCard
                              key={tool.id}
                              tool={tool}
                              isFavorite={favoriteIds.includes(tool.id)}
                              isAuthenticated={!!user}
                              onToggleFavorite={handleToggleFavorite}
                            />
                          ))}
                       </div>

                       {filteredTools.length === 0 && (
                         <div className="text-center py-12 text-zinc-500">
                           No tools found matching your criteria.
                         </div>
                       )}

                       {/* Infinite Scroll Trigger */}
                       {hasMore && (
                         <div
                           ref={loadMoreRef}
                           className="flex justify-center py-8"
                         >
                           <div className="flex flex-col items-center gap-3">
                             <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                             <p className="text-sm text-zinc-400">Loading more tools...</p>
                           </div>
                         </div>
                       )}

                       {!hasMore && filteredTools.length > 0 && (
                         <div className="text-center py-8 text-zinc-500 text-sm">
                           ✨ You've seen all {filteredTools.length} tools
                         </div>
                       )}
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
                      onBack={() => navigate('/')}
                      onComplete={() => navigate('/')}
                  />
                </Suspense>
              )}
              {currentView === AppView.FAVORITES && (
                <Suspense fallback={<LoadingFallback />}>
                  <FavoritesPage
                    tools={tools}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={handleToggleFavorite}
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
                      onBack={() => navigate('/')}
                  />
                </Suspense>
              )}
              {currentView === AppView.PAGES && (
                <Suspense fallback={<LoadingFallback />}>
                  <GenericPage pageId={currentPageId} onBack={() => navigate('/')} />
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