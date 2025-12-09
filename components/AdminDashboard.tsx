import React, { useState } from 'react';
import { Tool, NewsArticle, UserProfile } from '../types';
import { Plus, Rss, Save, Loader2, AlertCircle, Newspaper, Image as ImageIcon, Upload, Wand2, Link, LayoutGrid, Eye, X, Trash2, BarChart3, TrendingUp, PieChart, PenTool, Video, Mic, Code, Briefcase, Check, Sparkles, Pencil, ArrowLeft, CheckCircle, ListTodo, ShieldAlert } from 'lucide-react';
import { extractToolFromRSSItem, extractNewsFromRSSItem, generateImage, analyzeToolTrends, generateDirectoryTools } from '../services/geminiService';
import { arrayBufferToBase64 } from '../services/audioUtils';
import ToolCard from './ToolCard';
import NewsModal from './NewsModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface AdminDashboardProps {
  tools: Tool[];
  news: NewsArticle[];
  user: UserProfile | null;
  onAddTool: (tool: Tool) => void;
  onUpdateTool: (id: string, tool: Tool) => void;
  onAddNews: (news: NewsArticle) => void;
  onUpdateNews: (id: string, news: NewsArticle) => void;
  onDeleteTool: (id: string) => void;
  onDeleteNews: (id: string) => void;
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    tools, news, user,
    onAddTool, onUpdateTool, 
    onAddNews, onUpdateNews,
    onDeleteTool, onDeleteNews, 
    onBack
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'rss' | 'news' | 'manage' | 'analyze'>('create');
  
  // State to track if we are editing an existing item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<{ type: 'tool' | 'news', data: any } | null>(null);

  // Tool Create State
  const [newTool, setNewTool] = useState<Partial<Tool>>({
    name: '',
    description: '',
    category: 'Writing',
    price: 'Freemium',
    website: 'https://',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  
  // Generation & Review State
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<Tool[]>([]);

  // RSS State
  const [rssUrl, setRssUrl] = useState('https://feeds.feedburner.com/TechCrunch/');
  const [rssItems, setRssItems] = useState<any[]>([]);
  const [fetchingRss, setFetchingRss] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rssError, setRssError] = useState('');

  // News Create State
  const [newNews, setNewNews] = useState<Partial<NewsArticle>>({
    title: '',
    description: '',
    content: '',
    source: '',
    imageUrl: '',
    category: 'Technology'
  });
  const [newsImageMode, setNewsImageMode] = useState<'url' | 'upload' | 'generate'>('url');
  const [generatingImg, setGeneratingImg] = useState(false);
  const [newsCategories, setNewsCategories] = useState(['Technology', 'Business', 'Innovation', 'Startup', 'Research', 'AI Model']);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Preview State
  const [previewItem, setPreviewItem] = useState<{ type: 'tool' | 'news', data: any } | null>(null);

  // Analysis State
  const [analysisReport, setAnalysisReport] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // Manage State
  const [manageTab, setManageTab] = useState<'tools' | 'news'>('tools');
  
  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string, type: 'tool' | 'news' } | null>(null);

  // Tool Categories Definition
  const toolCategories = [
    { id: 'Writing', icon: PenTool, color: 'text-pink-400' },
    { id: 'Image', icon: ImageIcon, color: 'text-emerald-400' },
    { id: 'Video', icon: Video, color: 'text-purple-400' },
    { id: 'Audio', icon: Mic, color: 'text-orange-400' },
    { id: 'Coding', icon: Code, color: 'text-blue-400' },
    { id: 'Business', icon: Briefcase, color: 'text-amber-400' },
  ];

  // --- Handlers ---

  const resetToolForm = () => {
      setNewTool({ name: '', description: '', category: 'Writing', price: 'Freemium', website: 'https://', tags: [] });
      setEditingId(null);
  };

  const resetNewsForm = () => {
      setNewNews({ title: '', description: '', content: '', source: '', imageUrl: '', category: 'Technology' });
      setNewsImageMode('url');
      setEditingId(null);
  };

  const startEditingTool = (tool: Tool) => {
      setNewTool(tool);
      setEditingId(tool.id);
      setActiveTab('create');
      setLastSuccess(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditingNews = (article: NewsArticle) => {
      setNewNews(article);
      setEditingId(article.id);
      setActiveTab('news');
      setLastSuccess(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateCandidates = async () => {
    setIsGeneratingBatch(true);
    try {
        const generatedTools = await generateDirectoryTools();
        setReviewQueue(prev => [...generatedTools, ...prev]);
        setLastSuccess(null);
    } catch(e: any) {
        alert("Batch generation failed: " + e.message);
    } finally {
        setIsGeneratingBatch(false);
    }
  };

  const handlePublishReviewTool = (tool: Tool) => {
      onAddTool(tool);
      setReviewQueue(prev => prev.filter(t => t.id !== tool.id));
      setLastSuccess({ type: 'tool', data: tool });
  };

  const handleEditReviewTool = (tool: Tool) => {
      setNewTool(tool);
      setReviewQueue(prev => prev.filter(t => t.id !== tool.id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDiscardReviewTool = (id: string) => {
      setReviewQueue(prev => prev.filter(t => t.id !== id));
  };

  const handlePublishAllReview = () => {
      if(confirm(`Are you sure you want to publish all ${reviewQueue.length} tools?`)) {
          reviewQueue.forEach(tool => onAddTool(tool));
          setReviewQueue([]);
          alert("All tools published!");
      }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTool.name || !newTool.description) return;

    const tool: Tool = {
      id: editingId || newTool.id || '', 
      name: newTool.name,
      description: newTool.description,
      category: newTool.category || 'Uncategorized',
      price: newTool.price || 'Free',
      tags: newTool.tags || [],
      website: newTool.website || '#',
      imageUrl: newTool.imageUrl || `https://picsum.photos/seed/${newTool.name}/400/250`
    };

    if (editingId) {
        onUpdateTool(editingId, tool);
    } else {
        onAddTool(tool);
    }
    
    setLastSuccess({ type: 'tool', data: tool });
    resetToolForm();
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.title || !newNews.content) return;

    const article: NewsArticle = {
      id: editingId || newNews.id || crypto.randomUUID(),
      title: newNews.title || "Untitled",
      description: newNews.description || "",
      content: newNews.content || "",
      source: newNews.source || "Nexus AI Blog",
      category: newNews.category || "General",
      imageUrl: newNews.imageUrl || `https://picsum.photos/seed/${newNews.title}/800/400`,
      date: new Date().toISOString()
    };

    if (editingId) {
        onUpdateNews(editingId, article);
    } else {
        onAddNews(article);
    }

    setLastSuccess({ type: 'news', data: article });
    resetNewsForm();
  };

  const handleAddNewsCategory = () => {
    if (newCategoryInput && !newsCategories.includes(newCategoryInput)) {
        setNewsCategories(prev => [...prev, newCategoryInput]);
        setNewNews(prev => ({ ...prev, category: newCategoryInput }));
        setNewCategoryInput('');
        setShowAddCategory(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const buffer = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        const mimeType = file.type;
        setNewNews(prev => ({ ...prev, imageUrl: `data:${mimeType};base64,${base64}` }));
      } catch (err) {
        console.error("Error reading file:", err);
      }
    }
  };

  const handleGenerateNewsImage = async () => {
    if (!newNews.title) {
        alert("Please enter a title first to generate an image.");
        return;
    }
    setGeneratingImg(true);
    try {
        const prompt = `Editorial illustration for a news article titled: "${newNews.title}". ${newNews.description || ''}. High quality, modern style.`;
        const res = await generateImage(prompt, "16:9", "1K");
        
        let imgData = null;
        for (const part of res.candidates?.[0]?.content?.parts || []) {
           if (part.inlineData) imgData = part.inlineData.data;
        }
        
        if (imgData) {
            setNewNews(prev => ({ ...prev, imageUrl: `data:image/png;base64,${imgData}` }));
        } else {
            alert("Failed to generate image.");
        }
    } catch (e: any) {
        console.error(e);
        alert("Error generating image: " + e.message);
    } finally {
        setGeneratingImg(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setNewTool(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
      setTagInput('');
    }
  };

    const fetchRSS = async () => {
    setFetchingRss(true);
    setRssError('');
    setRssItems([]);

    const mockXML = `
      <rss>
       <channel>
        <item>
           <title>New AI Assistant 'Cerebra' Launches Beta</title>
           <description>Cerebra is a new personal AI assistant that organizes your entire digital life. It connects with your calendar, email, and slack to provide actionable summaries.</description>
        </item>
        <item>
           <title>PixelPerfect: The Ultimate Image Upscaler</title>
           <description>A revolutionary new tool for photographers. Upscale images to 8K without losing quality using advanced GANs.</description>
        </item>
        <item>
           <title>CodeWiz 2.0 Released</title>
           <description>The popular coding assistant just got better. Now supports Rust and Go with real-time debugging suggestions.</description>
        </item>
       </channel>
      </rss>
    `;

    try {
      let items: any[] = [];

      // 1) Try rss2json (tolerant, no CORS issues)
      try {
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
        const data = await res.json();
        if (data?.items?.length) {
          items = data.items.slice(0, 10).map((item: any, i: number) => ({
            id: `rss-json-${i}`,
            title: item.title || '',
            description: item.description || item.content || '',
            link: item.link || '#'
          }));
        }
      } catch (e) {
        console.warn('rss2json fetch failed, will try allorigins xml.', e);
      }

        // 2) Fallback to allorigins (XML or CSV)
      if (!items.length) {
        try {
                 const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`);
                 const data = await res.json();
                 const payload = data.contents || '';

                 // Try XML parse first
                 if (payload.includes('<rss') || payload.includes('<feed')) {
                   const parser = new DOMParser();
                   const xmlDoc = parser.parseFromString(payload, "text/xml");
                   items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 15).map((item, i) => ({
                       id: `rss-${i}`,
                       title: item.querySelector("title")?.textContent || "",
                       description: item.querySelector("description")?.textContent || "",
                       link: item.querySelector('link')?.textContent || '#'
                   }));
                 }

                 // If not XML, try CSV (some rss.app endpoints return CSV)
                 if (!items.length && payload.includes(',')) {
                    const lines = payload.split(/\r?\n/).filter(Boolean);
                    if (lines.length > 1) {
                      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                      const titleIdx = headers.findIndex(h => h.includes('title'));
                      const descIdx = headers.findIndex(h => h.includes('description') || h.includes('content'));
                      const linkIdx = headers.findIndex(h => h === 'link' || h === 'url');
                      lines.slice(1).forEach((line, i) => {
                        const cols = line.split(',');
                        const title = titleIdx >= 0 ? cols[titleIdx] : '';
                        const description = descIdx >= 0 ? cols[descIdx] : '';
                        const link = linkIdx >= 0 ? cols[linkIdx] : '#';
                        if (title || description) {
                          items.push({
                            id: `rss-csv-${i}`,
                            title,
                            description,
                            link
                          });
                        }
                      });
                      items = items.slice(0, 15);
                    }
                 }
        } catch (e) {
          console.warn("allorigins fetch failed, using mock data.", e);
        }
      }

      // 3) Final fallback: mock data
      if (!items.length) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(mockXML, "text/xml");
        items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 5).map((item, i) => ({
           id: `rss-mock-${i}`,
           title: item.querySelector("title")?.textContent || "",
           description: item.querySelector("description")?.textContent || "",
           link: '#'
        }));
      }
        
      setRssItems(items);

    } catch (e: any) {
      console.error(e);
      setRssError("Failed to fetch feed. ensure URL is valid.");
    } finally {
      setFetchingRss(false);
    }
    };

  const convertRssToTool = async (item: any) => {
    setProcessingId(item.id);
    try {
        const extracted = await extractToolFromRSSItem(item.title, item.description);
        setNewTool({
            name: extracted.name || item.title,
            description: extracted.description || item.description,
            category: extracted.category || 'News',
            price: extracted.price || 'Unknown',
            tags: extracted.tags || ['RSS'],
        website: item.link || '#',
            imageUrl: `https://picsum.photos/seed/${extracted.name?.replace(/\s/g,'')}/400/250`
        });
        setActiveTab('create');
        setLastSuccess(null);
    } catch (e) {
        console.error(e);
        alert("Failed to extract tool info.");
    } finally {
        setProcessingId(null);
    }
  };

  const convertRssToNews = async (item: any) => {
    setProcessingId(item.id);
    try {
        const extracted = await extractNewsFromRSSItem(item.title, item.description);
        setNewNews({
            title: extracted.title || item.title,
            description: extracted.description || item.description,
            content: extracted.content || item.description, 
        source: item.link || 'RSS Feed',
            imageUrl: `https://picsum.photos/seed/${(extracted.title || item.title).replace(/\s/g,'')}/800/400`,
            category: 'Tech News'
        });
        setActiveTab('news');
        setLastSuccess(null);
    } catch (e) {
        console.error(e);
        alert("Failed to extract news info.");
    } finally {
        setProcessingId(null);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisReport('');
    try {
      const report = await analyzeToolTrends(tools);
      setAnalysisReport(report);
    } catch (e: any) {
      setAnalysisReport('Error generating report: ' + e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePreview = (type: 'tool' | 'news', data?: any) => {
      const itemToPreview = data || (type === 'tool' ? {
        id: 'preview',
        name: newTool.name || 'Preview Name',
        description: newTool.description || 'Preview Description',
        category: newTool.category || 'Preview',
        price: newTool.price || 'Free',
        tags: newTool.tags || [],
        website: newTool.website || '#',
        imageUrl: newTool.imageUrl || `https://picsum.photos/seed/${newTool.name || 'preview'}/400/250`
      } : {
        id: 'preview',
        title: newNews.title || 'Preview Title',
        description: newNews.description || 'Preview Description',
        content: newNews.content || 'Preview Content',
        source: newNews.source || 'Preview Source',
        category: newNews.category || 'Preview Category',
        imageUrl: newNews.imageUrl || `https://picsum.photos/seed/${newNews.title || 'preview'}/800/400`,
        date: new Date().toISOString()
      });

      setPreviewItem({ type, data: itemToPreview });
  };
  
  const initiateDeleteTool = (tool: Tool) => {
      setDeleteTarget({ id: tool.id, name: tool.name, type: 'tool' });
  };

  const initiateDeleteNews = (article: NewsArticle) => {
      setDeleteTarget({ id: article.id, name: article.title, type: 'news' });
  };

  const handleConfirmDelete = () => {
      if (!deleteTarget) return;
      if (deleteTarget.type === 'tool') {
          onDeleteTool(deleteTarget.id);
      } else {
          onDeleteNews(deleteTarget.id);
      }
      setDeleteTarget(null);
  };

  // Stats for Analyze tab
  const categoryCounts = tools.reduce((acc, tool) => {
    acc[tool.category] = (acc[tool.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // --- RENDER LOGIC ---

  // Security Check Logic moved here to prevent Hook Error #300
  if (!user || user.role !== 'admin') {
      return (
          <div className="max-w-4xl mx-auto p-12 text-center">
              <div className="bg-red-900/20 border border-red-900/50 p-8 rounded-2xl inline-block max-w-md">
                 <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                 <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                 <p className="text-zinc-400 mb-6">
                     You do not have permission to view the Admin Dashboard. Please log in with an administrator account.
                 </p>
                 <button onClick={onBack} className="bg-zinc-800 text-white px-6 py-2 rounded-lg hover:bg-zinc-700">
                     Back to Home
                 </button>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
       <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-full transition-colors border border-zinc-700"
                title="Back to Directory"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-3xl font-bold text-white">Admin Dashboard</h2>
         </div>
         
         <div className="bg-zinc-900 rounded-lg p-1 border border-zinc-800 flex overflow-x-auto max-w-full scrollbar-hide">
            <button 
              onClick={() => { setActiveTab('create'); setEditingId(null); setLastSuccess(null); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'create' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Plus className="w-4 h-4 inline mr-2" /> {editingId ? 'Edit Tool' : 'Create'}
            </button>
            <button 
              onClick={() => { setActiveTab('news'); setEditingId(null); setLastSuccess(null); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'news' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Newspaper className="w-4 h-4 inline mr-2" /> {editingId ? 'Edit News' : 'News'}
            </button>
            <button 
              onClick={() => setActiveTab('rss')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'rss' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Rss className="w-4 h-4 inline mr-2" /> Import
            </button>
            <button 
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'manage' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4 inline mr-2" /> Manage
            </button>
            <button 
              onClick={() => setActiveTab('analyze')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'analyze' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" /> Analyze
            </button>
         </div>
       </div>

        {/* --- Success Feedback Banner --- */}
        {lastSuccess && (
            <div className="bg-emerald-900/20 border border-emerald-800 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h4 className="text-emerald-400 font-bold text-sm">Successfully Published</h4>
                        <p className="text-emerald-200/70 text-xs">
                           {lastSuccess.type === 'tool' ? lastSuccess.data.name : lastSuccess.data.title}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => handlePreview(lastSuccess.type, lastSuccess.data)}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1 bg-emerald-900/30 px-3 py-1.5 rounded-lg hover:bg-emerald-900/50 transition-colors"
                    >
                        <Eye className="w-4 h-4" /> Preview
                    </button>
                     <button 
                        onClick={() => lastSuccess.type === 'tool' ? startEditingTool(lastSuccess.data) : startEditingNews(lastSuccess.data)}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1 bg-emerald-900/30 px-3 py-1.5 rounded-lg hover:bg-emerald-900/50 transition-colors"
                    >
                        <Pencil className="w-4 h-4" /> Edit Again
                    </button>
                </div>
            </div>
        )}

       {/* --- Create Tool Tab --- */}
       {activeTab === 'create' && (
         <div className="space-y-6 animate-in fade-in duration-300">
            {/* Auto Generate & Review Section */}
            {!editingId && (
                <div className="space-y-4">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                Auto-Generate Candidates
                            </h3>
                            <p className="text-sm text-zinc-400 mt-1">
                                Generate fictional AI tools with Gemini 2.5 Flash, then review before publishing.
                            </p>
                        </div>
                        <button
                            onClick={handleGenerateCandidates}
                            disabled={isGeneratingBatch}
                            className="shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {isGeneratingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            <span>Generate Candidates</span>
                        </button>
                    </div>

                    {/* Review Queue */}
                    {reviewQueue.length > 0 && (
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-white font-semibold flex items-center gap-2">
                                    <ListTodo className="w-5 h-5 text-orange-400" />
                                    Review Queue ({reviewQueue.length})
                                </h4>
                                <button 
                                    onClick={handlePublishAllReview}
                                    className="text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-900/50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                >
                                    Publish All
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {reviewQueue.map((tool) => (
                                    <div key={tool.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex flex-col gap-3">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h5 className="text-white font-bold">{tool.name}</h5>
                                                <span className="text-[10px] uppercase bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{tool.category}</span>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{tool.description}</p>
                                        </div>
                                        <div className="flex gap-2 pt-2 border-t border-zinc-800">
                                            <button 
                                                onClick={() => handlePublishReviewTool(tool)}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-xs font-medium"
                                            >
                                                Publish
                                            </button>
                                            <button 
                                                onClick={() => handleEditReviewTool(tool)}
                                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded text-xs font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDiscardReviewTool(tool.id)}
                                                className="flex-1 bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 py-1.5 rounded text-xs font-medium"
                                            >
                                                Discard
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className={`bg-zinc-900/50 border rounded-xl p-6 ${editingId ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'border-zinc-800'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">
                        {editingId ? 'Edit Tool' : 'Add New Tool Manually'}
                    </h3>
                    {editingId && (
                        <button onClick={resetToolForm} className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Cancel Edit
                        </button>
                    )}
                </div>
                
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Tool Name</label>
                        <input required value={newTool.name} onChange={e => setNewTool({...newTool, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-indigo-500 outline-none" placeholder="e.g. Gemini Code Assist" />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Category</label>
                        <div className="grid grid-cols-3 gap-2">
                        {toolCategories.map(cat => (
                            <button
                            key={cat.id}
                            type="button"
                            onClick={() => setNewTool({...newTool, category: cat.id})}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                                newTool.category === cat.id 
                                ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:border-zinc-700'
                            }`}
                            >
                            <cat.icon className={`w-5 h-5 mb-1 ${newTool.category === cat.id ? 'text-white' : cat.color}`} />
                            <span className="text-[10px] uppercase font-semibold">{cat.id}</span>
                            </button>
                        ))}
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-zinc-400 mb-1">Description</label>
                    <textarea required value={newTool.description} onChange={e => setNewTool({...newTool, description: e.target.value})} placeholder="Tool description" className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white h-24 focus:border-indigo-500 outline-none" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Price</label>
                        <input value={newTool.price} onChange={e => setNewTool({...newTool, price: e.target.value})} placeholder="Price" className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-indigo-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Website URL</label>
                        <input value={newTool.website} onChange={e => setNewTool({...newTool, website: e.target.value})} placeholder="Website URL" className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-indigo-500 outline-none" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-zinc-400 mb-1">Tags (press enter)</label>
                    <div className="flex gap-2 mb-2 flex-wrap">
                        {newTool.tags?.map(t => <span key={t} className="bg-indigo-900 text-indigo-200 px-2 py-1 rounded text-xs">{t}</span>)}
                    </div>
                    <input 
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                        }
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-indigo-500 outline-none" 
                    placeholder="Type and press Enter..."
                    />
                </div>
                <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => handlePreview('tool')} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 border border-zinc-700">
                            <Eye className="w-4 h-4" /> Preview
                        </button>
                        <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> {editingId ? 'Update Tool' : 'Save Tool'}
                        </button>
                </div>
                </form>
            </div>
         </div>
       )}

       {/* --- Import RSS Tab --- */}
       {activeTab === 'rss' && (
         <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
               <h3 className="text-lg font-medium text-white mb-4">Import Tools from RSS</h3>
               <label className="block text-sm text-zinc-400 mb-1">RSS Feed URL</label>
               <div className="flex gap-2">
                  <input 
                    value={rssUrl} 
                    onChange={e => setRssUrl(e.target.value)} 
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded p-2 text-white"
                  />
                  <button 
                    onClick={fetchRSS} 
                    disabled={fetchingRss}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded font-medium disabled:opacity-50"
                  >
                    {fetchingRss ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch Feed'}
                  </button>
               </div>
               {rssError && (
                 <div className="mt-2 text-red-400 text-sm flex items-center gap-1">
                   <AlertCircle className="w-3 h-3" /> {rssError}
                 </div>
               )}
            </div>

            <div className="grid gap-4">
               {rssItems.length > 0 && <h3 className="text-white font-semibold">Feed Items ({rssItems.length})</h3>}
               {rssItems.map(item => (
                 <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex-1">
                       <h4 className="text-lg font-bold text-white mb-1">{item.title}</h4>
                       <p className="text-sm text-zinc-400 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                        <button 
                            onClick={() => convertRssToTool(item)}
                            disabled={!!processingId}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                        >
                            {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LayoutGrid className="w-3 h-3" />}
                            Edit as Tool
                        </button>
                        <button 
                            onClick={() => convertRssToNews(item)}
                            disabled={!!processingId}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                        >
                            {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Newspaper className="w-3 h-3" />}
                            Edit as News
                        </button>
                    </div>
                 </div>
               ))}
            </div>
         </div>
       )}

       {/* --- Create News Tab --- */}
       {activeTab === 'news' && (
          <div className={`bg-zinc-900/50 border rounded-xl p-6 animate-in fade-in duration-300 ${editingId ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' : 'border-zinc-800'}`}>
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-medium text-white">
                     {editingId ? 'Edit News Article' : 'Publish News Article'}
                 </h3>
                 {editingId && (
                     <button onClick={resetNewsForm} className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1">
                         <ArrowLeft className="w-4 h-4" /> Cancel Edit
                     </button>
                 )}
             </div>

             <form onSubmit={handleNewsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Article Title</label>
                        <input required value={newNews.title} onChange={e => setNewNews({...newNews, title: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-purple-500 outline-none" placeholder="e.g. Gemini 2.5 Released" />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Category</label>
                        <div className="flex gap-2">
                           {showAddCategory ? (
                               <div className="flex-1 flex gap-2">
                                  <input 
                                    value={newCategoryInput} 
                                    onChange={e => setNewCategoryInput(e.target.value)} 
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-purple-500 outline-none" 
                                    placeholder="New Category Name"
                                    autoFocus
                                  />
                                  <button type="button" onClick={handleAddNewsCategory} className="bg-purple-600 text-white px-3 rounded hover:bg-purple-500" aria-label="Add category"><Check className="w-4 h-4" /></button>
                                  <button type="button" onClick={() => setShowAddCategory(false)} className="bg-zinc-800 text-zinc-400 px-3 rounded hover:bg-zinc-700" aria-label="Cancel"><X className="w-4 h-4" /></button>
                               </div>
                           ) : (
                               <>
                                   <select 
                                     value={newNews.category} 
                                     onChange={e => setNewNews({...newNews, category: e.target.value})} 
                                     className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-purple-500 outline-none"
                                   >
                                       {newsCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                   </select>
                                   <button 
                                      type="button" 
                                      onClick={() => setShowAddCategory(true)}
                                      className="shrink-0 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 px-3 rounded"
                                      title="Add New Category"
                                   >
                                       <Plus className="w-4 h-4" />
                                   </button>
                               </>
                           )}
                        </div>
                    </div>
                </div>
                <div>
                   <label className="block text-sm text-zinc-400 mb-1">Short Description</label>
                   <textarea required value={newNews.description} onChange={e => setNewNews({...newNews, description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white h-20 focus:border-purple-500 outline-none" placeholder="A brief summary for the card view..." />
                </div>
                <div>
                   <label className="block text-sm text-zinc-400 mb-1">Full Content</label>
                   <textarea required value={newNews.content} onChange={e => setNewNews({...newNews, content: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white h-48 focus:border-purple-500 outline-none" placeholder="The full article content goes here..." />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                   <div>
                     <label className="block text-sm text-zinc-400 mb-2">Featured Image</label>
                     <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                       <div className="flex gap-4 mb-4 border-b border-zinc-800 pb-2">
                         <button 
                            type="button" 
                            onClick={() => setNewsImageMode('url')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${newsImageMode === 'url' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                         >
                            <Link className="w-4 h-4" /> Image URL
                         </button>
                         <button 
                            type="button" 
                            onClick={() => setNewsImageMode('upload')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${newsImageMode === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                         >
                            <Upload className="w-4 h-4" /> Upload
                         </button>
                         <button 
                            type="button" 
                            onClick={() => setNewsImageMode('generate')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${newsImageMode === 'generate' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                         >
                            <Wand2 className="w-4 h-4" /> Generate with AI
                         </button>
                       </div>

                       {newsImageMode === 'url' && (
                         <input 
                            value={newNews.imageUrl} 
                            onChange={e => setNewNews({...newNews, imageUrl: e.target.value})} 
                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white" 
                            placeholder="https://..." 
                         />
                       )}

                       {newsImageMode === 'upload' && (
                         <input 
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload} 
                            className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer" 
                         />
                       )}

                       {newsImageMode === 'generate' && (
                          <div className="flex gap-2 items-center">
                              <div className="text-sm text-zinc-400 italic flex-1">
                                 Uses <strong>Gemini 3 Pro</strong> to create an image based on the article title.
                              </div>
                              <button 
                                type="button" 
                                onClick={handleGenerateNewsImage}
                                disabled={generatingImg || !newNews.title}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                              >
                                {generatingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                Generate Image
                              </button>
                          </div>
                       )}

                       {newNews.imageUrl && (
                         <div className="mt-4 relative rounded-lg overflow-hidden border border-zinc-700 h-48 w-full">
                           <img src={newNews.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                           <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">Preview</div>
                         </div>
                       )}
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm text-zinc-400 mb-1">Source / Author</label>
                     <input value={newNews.source} onChange={e => setNewNews({...newNews, source: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-purple-500 outline-none" placeholder="e.g. TechCrunch" />
                   </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => handlePreview('news')} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 border border-zinc-700">
                        <Eye className="w-4 h-4" /> Preview
                    </button>
                    <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" /> {editingId ? 'Update Article' : 'Publish Article'}
                    </button>
                </div>
             </form>
          </div>
       )}

       {/* --- Manage Tab --- */}
       {activeTab === 'manage' && (
         <div className="space-y-6 animate-in fade-in duration-300">
           <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex w-fit">
              <button onClick={() => setManageTab('tools')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${manageTab === 'tools' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                Tools ({tools.length})
              </button>
              <button onClick={() => setManageTab('news')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${manageTab === 'news' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                News ({news.length})
              </button>
           </div>
           
           <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
             {manageTab === 'tools' ? (
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-zinc-400">
                   <thead className="bg-zinc-950 text-zinc-200 uppercase text-xs font-semibold">
                     <tr>
                       <th className="px-6 py-4">Name</th>
                       <th className="px-6 py-4">Category</th>
                       <th className="px-6 py-4">Price</th>
                       <th className="px-6 py-4 text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-800">
                     {tools.map(tool => (
                       <tr key={tool.id} className="hover:bg-zinc-900/80 transition-colors">
                         <td className="px-6 py-4 font-medium text-white">{tool.name}</td>
                         <td className="px-6 py-4">{tool.category}</td>
                         <td className="px-6 py-4">{tool.price}</td>
                         <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2">
                               <button 
                                   onClick={() => startEditingTool(tool)}
                                   className="text-indigo-400 hover:text-indigo-300 p-2 hover:bg-indigo-400/10 rounded-full transition-colors"
                                   title="Edit Tool"
                               >
                                   <Pencil className="w-4 h-4" />
                               </button>
                               <button 
                                   onClick={() => initiateDeleteTool(tool)} 
                                   className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-full transition-colors" 
                                   title="Delete Tool"
                               >
                                   <Trash2 className="w-4 h-4" />
                               </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-zinc-400">
                   <thead className="bg-zinc-950 text-zinc-200 uppercase text-xs font-semibold">
                     <tr>
                       <th className="px-6 py-4">Title</th>
                       <th className="px-6 py-4">Category</th>
                       <th className="px-6 py-4">Source</th>
                       <th className="px-6 py-4">Date</th>
                       <th className="px-6 py-4 text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-800">
                     {news.map(item => (
                       <tr key={item.id} className="hover:bg-zinc-900/80 transition-colors">
                         <td className="px-6 py-4 font-medium text-white truncate max-w-xs">{item.title}</td>
                         <td className="px-6 py-4"><span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full text-xs">{item.category || 'General'}</span></td>
                         <td className="px-6 py-4">{item.source}</td>
                         <td className="px-6 py-4">{new Date(item.date).toLocaleDateString()}</td>
                         <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2">
                               <button 
                                   onClick={() => startEditingNews(item)}
                                   className="text-purple-400 hover:text-purple-300 p-2 hover:bg-purple-400/10 rounded-full transition-colors"
                                   title="Edit Article"
                               >
                                   <Pencil className="w-4 h-4" />
                               </button>
                               <button 
                                   onClick={() => initiateDeleteNews(item)} 
                                   className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-full transition-colors" 
                                   title="Delete Article"
                               >
                                   <Trash2 className="w-4 h-4" />
                               </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
           </div>
         </div>
       )}

       {/* --- Analyze Tab --- */}
       {activeTab === 'analyze' && (
         <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex flex-col items-center justify-center">
                 <LayoutGrid className="w-8 h-8 text-indigo-500 mb-2" />
                 <span className="text-3xl font-bold text-white">{tools.length}</span>
                 <span className="text-sm text-zinc-500">Total Tools</span>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex flex-col items-center justify-center">
                 <Newspaper className="w-8 h-8 text-purple-500 mb-2" />
                 <span className="text-3xl font-bold text-white">{news.length}</span>
                 <span className="text-sm text-zinc-500">News Articles</span>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex flex-col items-center justify-center">
                 <PieChart className="w-8 h-8 text-emerald-500 mb-2" />
                 <span className="text-3xl font-bold text-white">{Object.keys(categoryCounts).length}</span>
                 <span className="text-sm text-zinc-500">Active Categories</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h3 className="text-lg font-bold text-white">AI Market Analysis</h3>
                   <p className="text-sm text-zinc-400">Powered by Gemini 3 Pro</p>
                 </div>
                 <button 
                   onClick={handleAnalyze} 
                   disabled={analyzing}
                   className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                 >
                   {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                   Generate Report
                 </button>
               </div>
               
               {analysisReport ? (
                 <div className="prose prose-invert max-w-none bg-black/30 p-6 rounded-lg border border-zinc-800">
                    <div className="whitespace-pre-wrap">{analysisReport}</div>
                 </div>
               ) : (
                 <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-lg text-zinc-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Click "Generate Report" to analyze current tool trends.</p>
                 </div>
               )}
            </div>
         </div>
       )}

       {/* --- Preview Overlay --- */}
       {previewItem && (
           <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
               <div className="relative w-full max-w-3xl">
                   <button 
                       onClick={() => setPreviewItem(null)}
                       className="absolute -top-12 right-0 bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-full border border-zinc-700"
                   >
                       <X className="w-6 h-6" />
                   </button>
                   
                   {previewItem.type === 'tool' ? (
                       <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                           <h4 className="text-white text-center mb-4 font-bold">Tool Card Preview</h4>
                           <div className="max-w-sm mx-auto">
                              <ToolCard tool={previewItem.data} />
                           </div>
                       </div>
                   ) : (
                       <NewsModal article={previewItem.data} onClose={() => setPreviewItem(null)} />
                   )}
               </div>
           </div>
       )}

       {/* --- Delete Confirmation Modal --- */}
       <DeleteConfirmationModal 
         isOpen={!!deleteTarget}
         onClose={() => setDeleteTarget(null)}
         onConfirm={handleConfirmDelete}
         itemName={deleteTarget?.name || ''}
         itemType={deleteTarget?.type || 'tool'}
       />
    </div>
  );
};

export default AdminDashboard;