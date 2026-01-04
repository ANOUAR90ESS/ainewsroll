import React, { useState, useEffect } from 'react';
import { Tool, NewsArticle, UserProfile } from '../types';
import { Plus, Rss, Save, Loader2, AlertCircle, Newspaper, Image as ImageIcon, Upload, Wand2, Link, LayoutGrid, Eye, X, Trash2, BarChart3, TrendingUp, PieChart, PenTool, Video, Mic, Code, Briefcase, Check, Sparkles, Pencil, ArrowLeft, CheckCircle, ListTodo, ShieldAlert, GraduationCap, Activity, Palette, Database, Globe, RefreshCw } from 'lucide-react';
import { extractToolFromRSSItem, extractNewsFromRSSItem, analyzeToolTrends, generateDirectoryTools, generateImageForTool, generateToolFromTopic, generateNewsFromTopic } from '../services/openaiService';
import { arrayBufferToBase64 } from '../services/audioUtils';
import { getUnsplashImageForNews, getUnsplashImageForTool } from '../services/unsplashService';
import ToolCard from './ToolCard';
import NewsModal from './NewsModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import NewsScraperModal from './NewsScraperModal';

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
  const [activeTab, setActiveTab] = useState<'create' | 'rss' | 'news' | 'manage' | 'analyze' | 'courses'>('create');

  // State to track if we are editing an existing item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<{ type: 'tool' | 'news', data: any } | null>(null);

  // Courses state
  const [existingCourses, setExistingCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

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
  const [toolImageMode, setToolImageMode] = useState<'url' | 'upload' | 'generate'>('url');
  const [toolImagePrompt, setToolImagePrompt] = useState('');
  const [generatingToolImg, setGeneratingToolImg] = useState(false);
  
  // AI Topic Generation State
  const [topicInput, setTopicInput] = useState('');
  const [generatingFromTopic, setGeneratingFromTopic] = useState(false);
  const [newsTopicInput, setNewsTopicInput] = useState('');
  const [generatingNewsFromTopic, setGeneratingNewsFromTopic] = useState(false);
  
  // Generation & Review State
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<Tool[]>([]);
  const [batchCount, setBatchCount] = useState(9);
  const [batchCategory, setBatchCategory] = useState<string>('All Categories');

  // RSS State
  const [rssUrl, setRssUrl] = useState('https://feeds.feedburner.com/TechCrunch/');
  const [rssItems, setRssItems] = useState<any[]>([]);
  const [fetchingRss, setFetchingRss] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rssError, setRssError] = useState('');
  const [autoImportingNews, setAutoImportingNews] = useState(false);
  const [autoImportProgress, setAutoImportProgress] = useState({ current: 0, total: 0 });

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
  const [newsImagePrompt, setNewsImagePrompt] = useState('');
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

  // News Scraper Modal State
  const [isScraperModalOpen, setIsScraperModalOpen] = useState(false);

  // Load courses when courses tab is active
  useEffect(() => {
    if (activeTab === 'courses') {
      fetchExistingCourses();
    }
  }, [activeTab]);

  const fetchExistingCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setExistingCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setExistingCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    if (!confirm(`Are you sure you want to delete the course "${courseName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteCourse',
          id: courseId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      // Refresh the courses list
      await fetchExistingCourses();
      alert('Course deleted successfully!');
    } catch (error: any) {
      alert(`Error deleting course: ${error.message}`);
    }
  };

  const handleRegenerateImage = async (tool: Tool) => {
    if (!confirm(`Regenerate image for "${tool.name}"? This will fetch a new image from Unsplash.`)) {
      return;
    }

    try {
      // Fetch new image from Unsplash
      const newImageUrl = await getUnsplashImageForTool(tool.name, tool.category);

      // Update the tool with the new image
      const updatedTool = { ...tool, imageUrl: newImageUrl };
      await onUpdateTool(tool.id, updatedTool);

      alert('Image regenerated successfully!');
    } catch (error: any) {
      alert(`Error regenerating image: ${error.message}`);
    }
  };

  // Tool Categories Definition
  const toolCategories = [
    { id: 'Writing', icon: PenTool, color: 'text-pink-400' },
    { id: 'Image', icon: ImageIcon, color: 'text-emerald-400' },
    { id: 'Video', icon: Video, color: 'text-purple-400' },
    { id: 'Audio', icon: Mic, color: 'text-orange-400' },
    { id: 'Coding', icon: Code, color: 'text-blue-400' },
    { id: 'Business', icon: Briefcase, color: 'text-amber-400' },
    { id: 'Data Analysis', icon: Database, color: 'text-cyan-400' },
    { id: 'Education', icon: GraduationCap, color: 'text-green-400' },
    { id: 'Healthcare', icon: Activity, color: 'text-red-400' },
    { id: 'Design', icon: Palette, color: 'text-violet-400' },
  ];

  // --- Handlers ---

    const resetToolForm = () => {
      setNewTool({ name: '', description: '', category: 'Writing', price: 'Freemium', website: 'https://', tags: [] });
      setToolImageMode('url');
      setToolImagePrompt('');
      setEditingId(null);
    };

    const resetNewsForm = () => {
      setNewNews({ title: '', description: '', content: '', source: '', imageUrl: '', category: 'Technology' });
      setNewsImageMode('url');
      setNewsImagePrompt('');
      setEditingId(null);
    };

  const startEditingTool = (tool: Tool) => {
      setNewTool(tool);
      setToolImageMode('url');
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
        console.log(`🚀 Starting batch generation of ${batchCount} AI tools${batchCategory !== 'All Categories' ? ` in ${batchCategory} category` : ''} with images...`);
        const categoryParam = batchCategory === 'All Categories' ? undefined : batchCategory;
        const generatedTools = await generateDirectoryTools(batchCount, categoryParam);
        console.log(`✅ Successfully generated ${generatedTools.length} tools with AI images`);
        setReviewQueue(prev => [...generatedTools, ...prev]);
        setLastSuccess(null);
    } catch(e: any) {
        console.error('❌ Batch generation error:', e);
        alert("Batch generation failed: " + e.message);
    } finally {
        setIsGeneratingBatch(false);
    }
  };

  const handlePublishReviewTool = async (tool: Tool) => {
      try {
          console.log('📤 Publishing tool from review queue:', tool.name);
          await onAddTool(tool);
          setReviewQueue(prev => prev.filter(t => t.id !== tool.id));
          setLastSuccess({ type: 'tool', data: tool });
          console.log('✅ Tool published successfully:', tool.name);
      } catch (error: any) {
          console.error('❌ Error publishing tool:', error);
          alert(`Failed to publish tool "${tool.name}": ${error.message}`);
      }
  };

  const handleEditReviewTool = (tool: Tool) => {
      setNewTool(tool);
      setReviewQueue(prev => prev.filter(t => t.id !== tool.id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDiscardReviewTool = (id: string) => {
      setReviewQueue(prev => prev.filter(t => t.id !== id));
  };

  const handlePublishAllReview = async () => {
      if(!confirm(`Are you sure you want to publish all ${reviewQueue.length} tools?`)) {
          return;
      }

      console.log(`📤 Publishing ${reviewQueue.length} tools...`);
      let successCount = 0;
      let errorCount = 0;

      for (const tool of reviewQueue) {
          try {
              console.log(`📝 Publishing ${successCount + 1}/${reviewQueue.length}: ${tool.name}`);
              await onAddTool(tool);
              successCount++;
              console.log(`✅ Published: ${tool.name}`);
          } catch (error: any) {
              errorCount++;
              console.error(`❌ Failed to publish ${tool.name}:`, error);
          }
      }

      setReviewQueue([]);

      if (errorCount === 0) {
          alert(`✅ Successfully published all ${successCount} tools!`);
      } else {
          alert(`⚠️ Published ${successCount} tools, but ${errorCount} failed. Check console for details.`);
      }
  };

  // Generate complete tool from just a topic/name using AI
  const handleGenerateFromTopic = async () => {
    if (!topicInput.trim()) {
      alert('Please enter a tool name or topic');
      return;
    }

    setGeneratingFromTopic(true);
    try {
      const generatedTool = await generateToolFromTopic(topicInput);
      
      // Auto-populate the form with AI-generated data
      setNewTool({
        ...generatedTool,
        imageUrl: generatedTool.imageUrl || newTool.imageUrl
      });
      
      // Generate image for the tool
      if (generatedTool.name) {
        try {
          const imageUrl = await generateImageForTool(
            generatedTool.name,
            generatedTool.category || 'Business',
            generatedTool.description || ''
          );
          setNewTool(prev => ({ ...prev, imageUrl }));
        } catch (imgError) {
          console.warn('Failed to generate image, using category default');
        }
      }
      
      alert(`✅ Tool "${generatedTool.name}" generated! Review and save when ready.`);
      setTopicInput('');
    } catch (error) {
      console.error('Failed to generate tool from topic:', error);
      alert(`Failed to generate tool: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingFromTopic(false);
    }
  };

  const handleGenerateNewsFromTopic = async () => {
    if (!newsTopicInput.trim()) {
      alert('Please enter a news topic');
      return;
    }

    setGeneratingNewsFromTopic(true);
    try {
      const article = await generateNewsFromTopic(newsTopicInput.trim());
      setNewNews({
        ...newNews,
        ...article,
        imageUrl: article.imageUrl || newNews.imageUrl,
        source: article.source || 'Google News'
      });
      setActiveTab('news');
      setLastSuccess(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setNewsTopicInput('');
    } catch (error) {
      console.error('Failed to generate news from topic:', error);
      alert(`Failed to generate news: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingNewsFromTopic(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTool.name || !newTool.description) return;

    // Generate appropriate image URL based on category
    const categoryImages: Record<string, string> = {
      'Writing': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1280&h=720&fit=crop&q=80',
      'Content Generation': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&h=720&fit=crop&q=80',
      'Image Generation': 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1280&h=720&fit=crop&q=80',
      'Video Editing': 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1280&h=720&fit=crop&q=80',
      'Audio Production': 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1280&h=720&fit=crop&q=80',
      'Voice Synthesis': 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1280&h=720&fit=crop&q=80',
      'Music Generation': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1280&h=720&fit=crop&q=80',
      'Code Generation': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1280&h=720&fit=crop&q=80',
      'Data Analysis': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720&fit=crop&q=80',
      'Data Analytics': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&h=720&fit=crop&q=80',
      'Customer Support': 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1280&h=720&fit=crop&q=80',
      'Healthcare': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1280&h=720&fit=crop&q=80',
      'Personal Productivity': 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1280&h=720&fit=crop&q=80',
      'Marketing': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&h=720&fit=crop&q=80',
      'Natural Language Processing': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80',
      'Text Generation': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80',
      '3D Modeling': 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=1280&h=720&fit=crop&q=80',
    };

    const defaultImage = categoryImages[newTool.category || ''] || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80';

    const tool: Tool = {
      id: editingId || newTool.id || `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newTool.name,
      description: newTool.description,
      category: newTool.category || 'Uncategorized',
      price: newTool.price || 'Free',
      tags: newTool.tags || [],
      website: newTool.website || '#',
      imageUrl: newTool.imageUrl || defaultImage,
      // Detailed fields
      how_to_use: newTool.how_to_use || '',
      features_detailed: newTool.features_detailed || '',
      use_cases: newTool.use_cases || '',
      pros_cons: newTool.pros_cons || '',
      screenshots_urls: newTool.screenshots_urls || []
    };

    console.log('📝 Saving tool:', tool);

    try {
      if (editingId) {
          console.log('✏️ Updating existing tool:', editingId);
          await onUpdateTool(editingId, tool);
      } else {
          console.log('➕ Adding new tool');
          await onAddTool(tool);
      }

      console.log('✅ Tool saved successfully!');
      setLastSuccess({ type: 'tool', data: tool });
      resetToolForm();
    } catch (error: any) {
      console.error('❌ Error saving tool:', error);
      alert(`Failed to save tool: ${error.message || 'Unknown error'}`);
    }
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.title || !newNews.content) return;

    // Auto-generate image if not provided
    let finalImageUrl: string = newNews.imageUrl || '';
    if (!finalImageUrl || finalImageUrl === '') {
      console.log('🎨 Auto-generating image for news article...');
      setGeneratingImg(true);
      try {
        // Generate image based on title and category using Unsplash
        console.log('🎨 Fetching Unsplash image for news article...');
        const generatedUrl = await getUnsplashImageForNews(newNews.title || '', newNews.category || 'Technology');
        finalImageUrl = generatedUrl;
        console.log('✅ Unsplash image fetched successfully:', generatedUrl);
      } catch (error) {
        console.error('❌ Failed to generate image:', error);
        // Fallback to placeholder if generation fails
        finalImageUrl = `https://picsum.photos/seed/${newNews.title}/800/400`;
      } finally {
        setGeneratingImg(false);
      }
    }

    const article: NewsArticle = {
      id: editingId || newNews.id || crypto.randomUUID(),
      title: newNews.title || "Untitled",
      description: newNews.description || "",
      content: newNews.content || "",
      source: newNews.source || "Nexus AI Blog",
      category: newNews.category || "General",
      imageUrl: finalImageUrl,
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

  const handleToolFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const buffer = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        const mimeType = file.type;
        setNewTool(prev => ({ ...prev, imageUrl: `data:${mimeType};base64,${base64}` }));
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
      // Use custom prompt as search query if provided, otherwise use title + category
      const searchQuery = newsImagePrompt?.trim() || newNews.title || '';
      console.log('🎨 Fetching Unsplash image with query:', searchQuery);

      const imageUrl = await getUnsplashImageForNews(
        searchQuery,
        newNews.category || 'Technology'
      );

      console.log('✅ Unsplash image URL:', imageUrl);
      setNewNews(prev => ({ ...prev, imageUrl }));
    } catch (e: any) {
        console.error('Error in handleGenerateNewsImage:', e);
        alert("Error generating image: " + e.message);
    } finally {
        setGeneratingImg(false);
    }
  };

  const handleGenerateToolImage = async () => {
    if (!newTool.name) {
        alert("Please enter a tool name first to generate an image.");
        return;
    }
    setGeneratingToolImg(true);
    try {
        // Use custom prompt as search query if provided, otherwise use tool name
        const searchQuery = toolImagePrompt?.trim() || newTool.name || '';
        console.log('🎨 Fetching Unsplash image for tool with query:', searchQuery);

        const imageUrl = await getUnsplashImageForTool(
          searchQuery,
          newTool.category || 'Technology'
        );

        console.log('✅ Unsplash tool image URL:', imageUrl);
        setNewTool(prev => ({ ...prev, imageUrl }));
    } catch (e: any) {
        console.error('Error in handleGenerateToolImage:', e);
        alert("Error generating tool image: " + e.message);
    } finally {
        setGeneratingToolImg(false);
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
                      const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
                      const titleIdx = headers.findIndex((h: string) => h.includes('title'));
                      const descIdx = headers.findIndex((h: string) => h.includes('description') || h.includes('content'));
                      const linkIdx = headers.findIndex((h: string) => h === 'link' || h === 'url');
                      lines.slice(1).forEach((line: string, i: number) => {
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
    const stripHtml = (html: string) => {
      const tmp = document.createElement('DIV');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    setProcessingId(item.id ?? item.link ?? crypto.randomUUID());
    try {
        const extracted = await extractToolFromRSSItem(item.title, item.description);

        const toolName = (extracted.name || item.title || 'RSS Tool').substring(0, 200);
        const toolDescription = (extracted.description || stripHtml(item.description || '')).substring(0, 500);
        const toolCategory = extracted.category || 'News';

        let aiImageUrl: string | undefined;
        try {
          aiImageUrl = await generateImageForTool(toolName, toolDescription, toolCategory);
        } catch (imgErr) {
          console.warn('Image generation failed, using placeholder', imgErr);
          aiImageUrl = `https://picsum.photos/seed/${encodeURIComponent(toolName)}/800/400`;
        }

        setNewTool({
            name: toolName,
            description: toolDescription,
            category: toolCategory,
            price: extracted.price || 'Unknown',
            tags: extracted.tags || ['RSS'],
            website: item.link || '#',
            imageUrl: aiImageUrl
        });
        setActiveTab('create');
        setLastSuccess(null);
    } catch (e) {
        console.error(e);
        const fallbackName = (item.title || 'RSS Tool').substring(0, 200);
        setNewTool({
          name: fallbackName,
          description: stripHtml(item.description || '').substring(0, 500),
          category: 'News',
          price: 'Unknown',
          tags: ['RSS'],
          website: item.link || '#',
          imageUrl: `https://picsum.photos/seed/${encodeURIComponent(fallbackName)}/800/400`
        });
        setActiveTab('create');
        alert("No se pudo extraer con IA; cargamos el item RSS en el formulario.");
    } finally {
        setProcessingId(null);
    }
  };

  const convertRssToNews = async (item: any) => {
    const stripHtml = (html: string) => {
      const tmp = document.createElement('DIV');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    setProcessingId(item.id ?? item.link ?? crypto.randomUUID());
    try {
      const extracted = await extractNewsFromRSSItem(item.title, item.description);
      setNewNews({
        title: (extracted.title || item.title || 'RSS News').substring(0, 200),
        description: stripHtml(extracted.description || item.description).substring(0, 300),
        content: stripHtml(extracted.content || item.description).substring(0, 1000),
        source: item.link || 'RSS Feed',
        imageUrl: `https://picsum.photos/800/400?random=${Date.now()}`,
        category: extracted.category || 'Tech News'
      });
      setActiveTab('news');
      setLastSuccess(null);
    } catch (e) {
      console.error(e);
      setNewNews({
        title: (item.title || 'RSS News').substring(0, 200),
        description: stripHtml(item.description || '').substring(0, 300),
        content: stripHtml(item.description || '').substring(0, 1000),
        source: item.link || 'RSS Feed',
        imageUrl: `https://picsum.photos/800/400?random=${Date.now()}`,
        category: 'Tech News'
      });
      setActiveTab('news');
      alert("No se pudo extraer con IA; cargamos el item RSS en el formulario.");
    } finally {
      setProcessingId(null);
    }
  };

    const publishRssAsNews = async (item: any) => {
    setProcessingId(item.id);
    try {
      const extracted = await extractNewsFromRSSItem(item.title, item.description);
      
      // Strip HTML tags from description and content
      const stripHtml = (html: string) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      };
      
      const cleanDescription = stripHtml(extracted.description || item.description).substring(0, 300).trim();
      const cleanContent = stripHtml(extracted.content || item.description).substring(0, 1000).trim();
      const title = (extracted.title || item.title).substring(0, 200).trim();
      
      // Generate AI image for the article
      const newsImageUrl = await generateImage(
        `Create a professional editorial illustration for a news article. Title: "${title}". Description: ${cleanDescription}. Style: modern, professional, news illustration.`,
        "16:9",
        "1K"
      );
      
      const article: NewsArticle = {
        id: crypto.randomUUID(),
        title,
        description: cleanDescription || 'Breaking news article from RSS feed.',
        content: cleanContent,
        source: item.link || 'RSS Feed',
        imageUrl: newsImageUrl || `https://picsum.photos/800/400?random=${Date.now()}`,
        category: extracted.category || 'Tech News',
        date: new Date().toISOString()
      };
      
      console.log('Publishing news from RSS:', article);
      await onAddNews(article);
      setLastSuccess({ type: 'news', data: article });
    } catch (e) {
      console.error('Error publishing RSS as news:', e);
      alert("Failed to publish news from RSS. Check console for details.");
    } finally {
      setProcessingId(null);
    }
    };

  const autoImportAllNews = async () => {
    if (rssItems.length === 0) {
      alert('No RSS items to import. Please fetch a feed first.');
      return;
    }

    const confirmImport = confirm(
      `Import ${rssItems.length} news articles automatically?\n\nThis will:\n- Generate AI images for each article\n- Extract content using AI\n- Publish directly to the news feed\n\nThis may take a few minutes and use API credits.`
    );

    if (!confirmImport) return;

    setAutoImportingNews(true);
    setAutoImportProgress({ current: 0, total: rssItems.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rssItems.length; i++) {
      const item = rssItems[i];
      setAutoImportProgress({ current: i + 1, total: rssItems.length });

      try {
        const extracted = await extractNewsFromRSSItem(item.title, item.description);

        const stripHtml = (html: string) => {
          const tmp = document.createElement('DIV');
          tmp.innerHTML = html;
          return tmp.textContent || tmp.innerText || '';
        };

        const cleanDescription = stripHtml(extracted.description || item.description).substring(0, 300).trim();
        const cleanContent = stripHtml(extracted.content || item.description).substring(0, 1000).trim();
        const title = (extracted.title || item.title).substring(0, 200).trim();

        // Fetch Unsplash image
        let newsImageUrl: string;
        try {
          newsImageUrl = await getUnsplashImageForNews(title, extracted.category || 'Technology');
          console.log('✅ Unsplash image fetched for RSS item:', title);
        } catch (imgError) {
          console.warn('Unsplash fetch failed, using placeholder:', imgError);
          newsImageUrl = `https://picsum.photos/800/400?random=${Date.now()}-${i}`;
        }

        const article: NewsArticle = {
          id: crypto.randomUUID(),
          title,
          description: cleanDescription || 'Breaking news from RSS feed.',
          content: cleanContent,
          source: item.link || 'RSS Feed',
          imageUrl: newsImageUrl,
          category: extracted.category || 'Technology',
          date: new Date().toISOString()
        };

        await onAddNews(article);
        successCount++;
        console.log(`✅ Imported ${i + 1}/${rssItems.length}: ${title}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to import item ${i + 1}:`, error);
      }
    }

    setAutoImportingNews(false);
    setAutoImportProgress({ current: 0, total: 0 });
    setRssItems([]); // Clear RSS items after import

    alert(
      `Auto-import complete!\n\n✅ Successfully imported: ${successCount}\n❌ Failed: ${errorCount}\n\nCheck the News tab to see your articles.`
    );
  };

  const handleImportScrapedNews = async (articles: NewsArticle[]) => {
    let successCount = 0;
    let errorCount = 0;

    for (const article of articles) {
      try {
        await onAddNews(article);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error('Failed to import article:', error);
      }
    }

    if (errorCount > 0) {
      alert(`Imported ${successCount} articles. ${errorCount} failed.`);
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
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'courses' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <GraduationCap className="w-4 h-4 inline mr-2" /> Courses
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
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                    Auto-Generate Candidates
                                </h3>
                                <p className="text-sm text-zinc-400 mt-1">
                                    Generate fictional AI tools with Gemini 2.5 Flash + AI-generated images with Imagen 3
                                </p>
                            </div>
                        </div>

                        {/* Generation Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label htmlFor="batch-count" className="block text-sm text-zinc-400 mb-2">Number of Tools</label>
                              <select
                                id="batch-count"
                                aria-label="Number of Tools"
                                value={batchCount} 
                                onChange={(e) => setBatchCount(Number(e.target.value))}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-indigo-500 outline-none"
                                disabled={isGeneratingBatch}
                              >
                                    <option value={3}>3 tools</option>
                                    <option value={5}>5 tools</option>
                                    <option value={9}>9 tools</option>
                                    <option value={12}>12 tools</option>
                                    <option value={15}>15 tools</option>
                                    <option value={20}>20 tools</option>
                                    <option value={30}>30 tools</option>
                                    <option value={40}>40 tools</option>
                                    <option value={50}>50 tools</option>
                                    <option value={75}>75 tools</option>
                                    <option value={100}>100 tools</option>
                                </select>
                            </div>
                            
                            <div>
                              <label htmlFor="batch-category" className="block text-sm text-zinc-400 mb-2">Category Filter</label>
                              <select
                                id="batch-category"
                                aria-label="Category Filter"
                                value={batchCategory} 
                                onChange={(e) => setBatchCategory(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-indigo-500 outline-none"
                                disabled={isGeneratingBatch}
                              >
                                    <option value="All Categories">All Categories</option>
                                    <option value="Writing">Writing</option>
                                    <option value="Image">Image</option>
                                    <option value="Video">Video</option>
                                    <option value="Audio">Audio</option>
                                    <option value="Coding">Coding</option>
                                    <option value="Business">Business</option>
                                    <option value="Data Analysis">Data Analysis</option>
                                    <option value="Education">Education</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Design">Design</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={handleGenerateCandidates}
                                    disabled={isGeneratingBatch}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isGeneratingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    <span>{isGeneratingBatch ? 'Generating...' : 'Generate'}</span>
                                </button>
                            </div>
                        </div>

                        {isGeneratingBatch && (
                            <div className="bg-indigo-950/20 border border-indigo-900/50 rounded-lg p-3 flex items-center gap-3">
                                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                                <div className="text-sm text-indigo-200">
                                    Generating {batchCount} {batchCategory !== 'All Categories' ? batchCategory : ''} tools with unique AI images... This may take a few moments.
                                </div>
                            </div>
                        )}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {reviewQueue.map((tool) => (
                                    <div key={tool.id} className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col hover:border-zinc-700 transition-colors">
                                        {/* Image Preview */}
                                        <div className="relative h-40 bg-zinc-900 overflow-hidden group">
                                            <img 
                                                src={tool.imageUrl} 
                                                alt={tool.name}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80';
                                                }}
                                            />
                                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-[10px] uppercase text-zinc-300 font-semibold">
                                                {tool.category}
                                            </div>
                                            {tool.price && (
                                                <div className="absolute bottom-2 left-2 bg-indigo-600/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-medium">
                                                    {tool.price}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="p-4 flex-1 flex flex-col">
                                            <h5 className="text-white font-bold text-sm mb-2 line-clamp-1">{tool.name}</h5>
                                            <p className="text-xs text-zinc-500 line-clamp-2 mb-3 flex-1">{tool.description}</p>
                                            
                                            {/* Tags */}
                                            {tool.tags && tool.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {tool.tags.slice(0, 3).map((tag, idx) => (
                                                        <span key={idx} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {tool.tags.length > 3 && (
                                                        <span className="text-[10px] text-zinc-600">+{tool.tags.length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Actions */}
                                            <div className="flex gap-2 pt-3 border-t border-zinc-800">
                                                <button 
                                                    onClick={() => handlePublishReviewTool(tool)}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-xs font-medium transition-colors"
                                                >
                                                    Publish
                                                </button>
                                                <button 
                                                    onClick={() => handleEditReviewTool(tool)}
                                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-xs font-medium transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDiscardReviewTool(tool.id)}
                                                    className="bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 py-2 px-3 rounded text-xs font-medium transition-colors"
                                                    title="Discard"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* AI Topic Generation Section */}
            <div className="bg-gradient-to-br from-indigo-950/50 to-purple-950/30 border border-indigo-800/50 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">AI Tool Generator</h3>
                        <p className="text-sm text-zinc-400">Just enter a tool name or topic - AI creates everything!</p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <input
                        value={topicInput}
                        onChange={e => setTopicInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !generatingFromTopic && handleGenerateFromTopic()}
                        placeholder="e.g., ChatGPT, image generation, code assistant..."
                        className="flex-1 bg-zinc-950/80 border border-indigo-700/50 rounded-lg p-3.5 text-white placeholder-zinc-500 focus:border-indigo-500 outline-none"
                        disabled={generatingFromTopic}
                    />
                    <button
                        onClick={handleGenerateFromTopic}
                        disabled={generatingFromTopic || !topicInput.trim()}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
                    >
                        {generatingFromTopic ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                Generate
                            </>
                        )}
                    </button>
                </div>
                
                <div className="mt-3 text-xs text-indigo-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                        AI will create: name, description, category, price, tags, website, how-to guide, features, use cases, pros & cons, and image!
                    </span>
                </div>
            </div>

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
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {toolCategories.map(cat => (
                            <button
                            key={cat.id}
                            type="button"
                            onClick={() => setNewTool({...newTool, category: cat.id})}
                            className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all ${
                                newTool.category === cat.id 
                                ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:border-zinc-700'
                            }`}
                            >
                            <cat.icon className={`w-4 h-4 mb-1 ${newTool.category === cat.id ? 'text-white' : cat.color}`} />
                            <span className="text-[9px] uppercase font-semibold text-center leading-tight">{cat.id}</span>
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
                
                {/* Detailed Fields Section */}
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> Detailed Information (Optional)
                  </h3>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">How to Use</label>
                    <textarea 
                      value={newTool.how_to_use || ''} 
                      onChange={e => setNewTool({...newTool, how_to_use: e.target.value})} 
                      placeholder="Step-by-step guide on how to use this tool..." 
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white h-20 focus:border-indigo-500 outline-none text-sm" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Key Features</label>
                    <textarea 
                      value={newTool.features_detailed || ''} 
                      onChange={e => setNewTool({...newTool, features_detailed: e.target.value})} 
                      placeholder="List key features (one per line)..." 
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white h-20 focus:border-indigo-500 outline-none text-sm" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Use Cases</label>
                    <textarea 
                      value={newTool.use_cases || ''} 
                      onChange={e => setNewTool({...newTool, use_cases: e.target.value})} 
                      placeholder="Real-world use cases and examples (one per line)..." 
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white h-20 focus:border-indigo-500 outline-none text-sm" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Pros & Cons</label>
                    <textarea 
                      value={newTool.pros_cons || ''} 
                      onChange={e => setNewTool({...newTool, pros_cons: e.target.value})} 
                      placeholder="Advantages and disadvantages of this tool..." 
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white h-20 focus:border-indigo-500 outline-none text-sm" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Featured Image</label>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                    <div className="flex gap-4 mb-4 border-b border-zinc-800 pb-2">
                      <button 
                         type="button" 
                         onClick={() => setToolImageMode('url')}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${toolImageMode === 'url' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                         <Link className="w-4 h-4" /> Image URL
                      </button>
                      <button 
                         type="button" 
                         onClick={() => setToolImageMode('upload')}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${toolImageMode === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                         <Upload className="w-4 h-4" /> Upload
                      </button>
                      <button 
                         type="button" 
                         onClick={() => setToolImageMode('generate')}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${toolImageMode === 'generate' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                         <Wand2 className="w-4 h-4" /> Generate with AI
                      </button>
                    </div>

                    {toolImageMode === 'url' && (
                      <input 
                         value={newTool.imageUrl || ''} 
                         onChange={e => setNewTool({...newTool, imageUrl: e.target.value})} 
                         className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white" 
                         placeholder="https://..." 
                      />
                    )}

                    {toolImageMode === 'upload' && (
                      <input 
                         type="file"
                         accept="image/*"
                         onChange={handleToolFileUpload}
                         aria-label="Upload tool image"
                         className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer" 
                      />
                    )}

                    {toolImageMode === 'generate' && (
                       <div className="space-y-3">
                           <div className="text-sm text-zinc-400 italic">
                              Uses <strong>Gemini Imagen 3</strong> to create an image based on your prompt plus the tool details.
                           </div>
                           <textarea
                             value={toolImagePrompt}
                             onChange={(e) => setToolImagePrompt(e.target.value)}
                             className="w-full bg-zinc-900 border border-zinc-700 rounded p-2.5 text-white text-sm focus:border-indigo-500 outline-none"
                             placeholder="Optional: Describe the style or scene you want (e.g., 'dark theme dashboard with charts and code panels')."
                             rows={3}
                           />
                           <div className="flex justify-end">
                             <button 
                               type="button" 
                               onClick={handleGenerateToolImage}
                               disabled={generatingToolImg || !newTool.name}
                               className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                             >
                               {generatingToolImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                               Generate Image
                             </button>
                           </div>
                       </div>
                    )}

                    {newTool.imageUrl && (
                      <div className="mt-4 relative rounded-lg overflow-hidden border border-zinc-700 h-48 w-full">
                        <img src={newTool.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">Preview</div>
                      </div>
                    )}
                  </div>
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
                    placeholder="Enter RSS feed URL"
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
               {rssItems.length > 0 && (
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                   <h3 className="text-white font-semibold">Feed Items ({rssItems.length})</h3>
                   <button
                     type="button"
                     onClick={autoImportAllNews}
                     disabled={autoImportingNews}
                     className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                   >
                     {autoImportingNews ? (
                       <>
                         <Loader2 className="w-5 h-5 animate-spin" />
                         Importing {autoImportProgress.current}/{autoImportProgress.total}...
                       </>
                     ) : (
                       <>
                         <Sparkles className="w-5 h-5" />
                         Auto-Import All News
                       </>
                     )}
                   </button>
                 </div>
               )}
               {rssItems.map(item => (
                 <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex flex-col gap-2">
                    <div>
                       <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>
                       <p className="text-xs text-zinc-400 line-clamp-1">{item.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <button 
                            onClick={() => convertRssToTool(item)}
                            disabled={!!processingId}
                            title="Edit as Tool"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded text-xs flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
                        >
                            {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LayoutGrid className="w-3 h-3" />}
                            <span className="hidden sm:inline">Tool</span>
                        </button>
                        <button 
                            onClick={() => convertRssToNews(item)}
                            disabled={!!processingId}
                            title="Edit as News"
                            className="bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1.5 rounded text-xs flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
                        >
                            {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Newspaper className="w-3 h-3" />}
                            <span className="hidden sm:inline">News</span>
                        </button>
                        <button 
                          onClick={() => publishRssAsNews(item)}
                          disabled={!!processingId}
                          title="Publish News"
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded text-xs flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
                        >
                          {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          <span className="hidden sm:inline">Publish</span>
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
                 <div className="flex items-center gap-2">
                   {!editingId && (
                     <button
                       type="button"
                       onClick={() => setIsScraperModalOpen(true)}
                       className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                     >
                       <Globe className="w-4 h-4" />
                       <span className="hidden sm:inline">Scrape Real News</span>
                       <span className="sm:hidden">Scrape</span>
                     </button>
                   )}
                   {editingId && (
                     <button onClick={resetNewsForm} className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1">
                         <ArrowLeft className="w-4 h-4" /> Cancel Edit
                     </button>
                   )}
                 </div>
             </div>

             <div className="bg-gradient-to-br from-purple-950/50 to-indigo-950/30 border border-purple-800/50 rounded-xl p-5 mb-5">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                   <Sparkles className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <h4 className="text-white font-semibold">AI News Generator</h4>
                   <p className="text-xs text-zinc-400">Enter a topic and we’ll draft an article using Google News context.</p>
                 </div>
               </div>
               <div className="flex gap-3 flex-col md:flex-row">
                 <input
                   value={newsTopicInput}
                   onChange={e => setNewsTopicInput(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && !generatingNewsFromTopic && handleGenerateNewsFromTopic()}
                   placeholder="e.g., OpenAI updates, Gemini 2.5, AI chips"
                   className="flex-1 bg-zinc-950/80 border border-purple-800/50 rounded-lg p-3.5 text-white placeholder-zinc-500 focus:border-purple-500 outline-none"
                   disabled={generatingNewsFromTopic}
                 />
                 <button
                   onClick={handleGenerateNewsFromTopic}
                   disabled={generatingNewsFromTopic || !newsTopicInput.trim()}
                   className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
                 >
                   {generatingNewsFromTopic ? (
                     <>
                       <Loader2 className="w-5 h-5 animate-spin" />
                       Generating...
                     </>
                   ) : (
                     <>
                       <Wand2 className="w-5 h-5" />
                       Generate
                     </>
                   )}
                 </button>
               </div>
               <div className="mt-2 text-[11px] text-purple-200 flex items-start gap-2">
                 <ShieldAlert className="w-4 h-4 mt-0.5 text-purple-400" />
                 <span>Uses Google News headlines for context, then drafts a fresh article. Review before publishing.</span>
               </div>
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
                                     aria-label="Select news category"
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
                            aria-label="Upload news image"
                            className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer" 
                         />
                       )}

                       {newsImageMode === 'generate' && (
                          <div className="space-y-3">
                              <div className="text-sm text-zinc-400 italic">
                                 Uses <strong>Gemini 3 Pro</strong> to create an image based on your prompt plus the article details.
                              </div>
                              <textarea
                                value={newsImagePrompt}
                                onChange={(e) => setNewsImagePrompt(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2.5 text-white text-sm focus:border-purple-500 outline-none"
                                placeholder="Optional: Describe the style or scene you want (e.g., 'editorial illustration with headline on holographic screens')."
                                rows={3}
                              />
                              <div className="flex justify-end">
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
                                   onClick={() => handleRegenerateImage(tool)}
                                   className="text-green-400 hover:text-green-300 p-2 hover:bg-green-400/10 rounded-full transition-colors"
                                   title="Regenerate Image from Unsplash"
                               >
                                   <RefreshCw className="w-4 h-4" />
                               </button>
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

       {/* --- Courses Tab --- */}
       {activeTab === 'courses' && (
         <div className="space-y-6 animate-in fade-in duration-300">
            {/* Existing Courses Section */}
            {existingCourses.length > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-green-400" />
                      Existing Courses ({existingCourses.length})
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      Manage your published courses
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {existingCourses.map(course => (
                    <div
                      key={course.id}
                      className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-green-500/50 transition-all group"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-900/30 to-emerald-900/30 flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-green-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-white font-medium text-sm line-clamp-2">{course.title}</h5>
                          <p className="text-xs text-zinc-500">{course.tool_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
                        <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded">{course.difficulty}</span>
                        <span>{course.content?.summary?.total_lessons || 0} lessons</span>
                        <span>•</span>
                        <span>{course.view_count || 0} views</span>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={`/courses/${course.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors text-center"
                        >
                          View Course
                        </a>
                        <button
                          onClick={() => handleDeleteCourse(course.id, course.title)}
                          className="bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                          title="Delete course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate New Course Section */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
               <div className="flex items-start justify-between gap-4 mb-6">
                 <div>
                   <h3 className="text-lg font-medium text-white flex items-center gap-2">
                     <GraduationCap className="w-5 h-5 text-indigo-400" />
                     Generate New Course
                   </h3>
                   <p className="text-sm text-zinc-400 mt-1">
                     Generate comprehensive courses from your tools using Gemini AI
                   </p>
                 </div>
               </div>

               {/* Tools List for Course Generation */}
               <div className="space-y-4">
                 <h4 className="text-white font-medium">Select a tool to generate a course:</h4>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {tools.map(tool => (
                     <div
                       key={tool.id}
                       className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-indigo-500/50 transition-all group"
                     >
                       <div className="flex items-start gap-3 mb-3">
                         {tool.imageUrl && (
                           <img
                             src={tool.imageUrl}
                             alt={tool.name}
                             className="w-12 h-12 rounded-lg object-cover"
                           />
                         )}
                         <div className="flex-1 min-w-0">
                           <h5 className="text-white font-medium text-sm line-clamp-1">{tool.name}</h5>
                           <p className="text-xs text-zinc-500">{tool.category}</p>
                         </div>
                       </div>

                       <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{tool.description}</p>

                       <button
                         onClick={async () => {
                           if (!confirm(`Generate a professional course for ${tool.name}? This will use GPT-4o and may take 30-60 seconds.`)) return;

                           const button = document.activeElement as HTMLButtonElement;
                           const originalText = button.innerHTML;
                           button.disabled = true;
                           button.innerHTML = '<svg class="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...';

                           try {
                             const response = await fetch('/api/courses', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({
                                 action: 'generateCourse',
                                 toolId: tool.id,
                                 toolName: tool.name,
                                 toolDescription: tool.description,
                                 category: tool.category,
                                 imageUrl: tool.imageUrl
                               })
                             });

                             const data = await response.json();

                             if (!response.ok) {
                               throw new Error(data.error || 'Failed to generate course');
                             }

                             button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Course Created!';
                             button.className = 'w-full bg-green-600 text-white text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2';

                             setTimeout(() => {
                               window.location.href = `/courses/${data.course.id}`;
                             }, 1500);

                           } catch (error: any) {
                             alert(`Error: ${error.message}`);
                             button.disabled = false;
                             button.innerHTML = originalText;
                           }
                         }}
                         className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 group-hover:bg-indigo-500"
                       >
                         <GraduationCap className="w-4 h-4" />
                         Generate Course
                       </button>
                     </div>
                   ))}
                 </div>

                 {tools.length === 0 && (
                   <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-lg text-zinc-500">
                     <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                     <p>No tools available. Create tools first to generate courses.</p>
                   </div>
                 )}
               </div>
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
                       aria-label="Close preview"
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

       {/* --- News Scraper Modal --- */}
       <NewsScraperModal
         isOpen={isScraperModalOpen}
         onClose={() => setIsScraperModalOpen(false)}
         onImportArticles={handleImportScrapedNews}
       />
    </div>
  );
};

export default AdminDashboard;