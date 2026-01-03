import React, { useState } from 'react';
import { NewsArticle } from '../types';
import { Loader2, Globe, Download, Sparkles, CheckCircle, RefreshCw, X } from 'lucide-react';
import { generateImage } from '../services/openaiService';

interface NewsScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportArticles: (articles: NewsArticle[]) => Promise<void>;
}

const categories = [
  { value: 'Technology', label: 'Technology', icon: '💻' },
  { value: 'Business', label: 'Business', icon: '💼' },
  { value: 'AI Model', label: 'AI & ML', icon: '🤖' },
  { value: 'Innovation', label: 'Innovation', icon: '💡' },
  { value: 'Startup', label: 'Startup', icon: '🚀' },
  { value: 'Research', label: 'Research', icon: '🔬' }
];

const NewsScraperModal: React.FC<NewsScraperModalProps> = ({ isOpen, onClose, onImportArticles }) => {
  const [selectedCategory, setSelectedCategory] = useState('Technology');
  const [articleCount, setArticleCount] = useState(3);
  const [scrapedArticles, setScrapedArticles] = useState<NewsArticle[]>([]);
  const [isScrapingNews, setIsScrapingNews] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleScrapeNews = async () => {
    setIsScrapingNews(true);
    setScrapedArticles([]);

    try {
      // Call OpenAI to fetch real news with internet search
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scrapeRealNews',
          payload: {
            category: selectedCategory,
            count: articleCount
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      const articles = data.articles || [];

      // Generate images for each article
      const articlesWithImages = await Promise.all(
        articles.map(async (article: any) => {
          let imageUrl = '';
          try {
            imageUrl = await generateImage(
              `Professional news photo for: ${article.title}. Photorealistic, high quality, journalistic style, editorial photography.`,
              '16:9',
              '1K'
            );
          } catch (error) {
            console.warn('Failed to generate image for article:', error);
            imageUrl = `https://picsum.photos/800/400?random=${Date.now()}-${article.title}`;
          }

          return {
            id: crypto.randomUUID(),
            title: article.title,
            description: article.summary || article.description,
            content: article.content,
            source: article.source || 'Web Scraping',
            imageUrl: imageUrl,
            category: selectedCategory,
            date: new Date().toISOString()
          } as NewsArticle;
        })
      );

      setScrapedArticles(articlesWithImages);
      console.log(`✅ Scraped ${articlesWithImages.length} news articles`);
    } catch (error: any) {
      console.error('❌ Error scraping news:', error);
      alert(`Failed to fetch news: ${error.message}`);
    } finally {
      setIsScrapingNews(false);
    }
  };

  const handleImportAll = async () => {
    setIsImporting(true);
    try {
      await onImportArticles(scrapedArticles);
      setScrapedArticles([]);
      onClose();
    } catch (error: any) {
      console.error('❌ Error importing articles:', error);
      alert(`Failed to import articles: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-purple-500/30 rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-400" />
                Import Real News Articles
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                Fetch current news from real sources across the internet
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-purple-500 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Number of Articles
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={articleCount}
                  onChange={(e) => setArticleCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Scrape Button */}
            <button
              onClick={handleScrapeNews}
              disabled={isScrapingNews}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isScrapingNews ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Fetching Latest News...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Fetch Latest News
                </>
              )}
            </button>

            {/* Scraped Articles */}
            {scrapedArticles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Found {scrapedArticles.length} Articles
                  </h3>
                  <button
                    onClick={handleImportAll}
                    disabled={isImporting}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Import All
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scrapedArticles.map((article, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-black/30 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {article.imageUrl && (
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1 line-clamp-2">
                            {article.title}
                          </h4>
                          <p className="text-sm text-zinc-400 mb-2 line-clamp-2">
                            {article.description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs px-2 py-1 rounded">
                              {article.category}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {new Date(article.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-zinc-300">
                  <p className="font-semibold text-blue-300 mb-1">How it works:</p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400">
                    <li>AI searches real news sources from across the internet</li>
                    <li>Fetches current, factual articles from the past few days</li>
                    <li>Generates professional images for each article using DALL-E</li>
                    <li>Articles are saved to your news feed for users to read</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsScraperModal;
