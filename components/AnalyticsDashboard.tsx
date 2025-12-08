import React from 'react';
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react';

/**
 * Analytics Metrics Dashboard Component
 * Shows key SEO and traffic metrics
 * (This is a template - real data would come from Google Analytics API)
 */

interface MetricCard {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

const AnalyticsDashboard: React.FC = () => {
  // These would be real data from Google Analytics API in production
  const metrics: MetricCard[] = [
    {
      label: 'Total Pageviews',
      value: '--',
      change: 'Update after Google Analytics setup',
      icon: <Eye className="w-6 h-6 text-blue-400" />
    },
    {
      label: 'Unique Users',
      value: '--',
      change: 'Update after Google Analytics setup',
      icon: <Users className="w-6 h-6 text-green-400" />
    },
    {
      label: 'Avg. Session Duration',
      value: '--',
      change: 'Update after Google Analytics setup',
      icon: <TrendingUp className="w-6 h-6 text-purple-400" />
    },
    {
      label: 'Search Impressions',
      value: '--',
      change: 'Update after Google Search Console setup',
      icon: <BarChart3 className="w-6 h-6 text-orange-400" />
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h2>
        <p className="text-zinc-400">
          Monitor your SEO performance and traffic metrics
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-zinc-400 mb-1">{metric.label}</p>
                <p className="text-3xl font-bold text-white">{metric.value}</p>
              </div>
              {metric.icon}
            </div>
            <p className="text-xs text-zinc-500">{metric.change}</p>
          </div>
        ))}
      </div>

      {/* Setup Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Analytics Setup */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-400" />
            Google Analytics 4 Setup
          </h3>
          <ol className="space-y-3 text-sm text-zinc-300">
            <li>1. Go to <a href="https://analytics.google.com" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics</a></li>
            <li>2. Create new property for <code className="bg-zinc-800 px-2 py-1 rounded">ainewsroll.space</code></li>
            <li>3. Get Measurement ID (format: G-XXXXXXXXXX)</li>
            <li>4. Update in `/services/analyticsService.ts`</li>
            <li>5. Deploy to Vercel</li>
            <li>6. Wait 24-48 hours for data collection</li>
          </ol>
        </div>

        {/* Google Search Console Setup */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            Google Search Console Setup
          </h3>
          <ol className="space-y-3 text-sm text-zinc-300">
            <li>1. Go to <a href="https://search.google.com/search-console" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">Search Console</a></li>
            <li>2. Add property: <code className="bg-zinc-800 px-2 py-1 rounded">ainewsroll.space</code></li>
            <li>3. Verify domain ownership</li>
            <li>4. Submit sitemap: <code className="bg-zinc-800 px-2 py-1 rounded">/sitemap.xml</code></li>
            <li>5. Request indexing for main pages</li>
            <li>6. Monitor for crawl errors</li>
          </ol>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 p-6 bg-indigo-900/20 border border-indigo-800/50 rounded-lg">
        <h3 className="text-lg font-bold text-indigo-300 mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm text-center"
          >
            Google Analytics
          </a>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors text-sm text-center"
          >
            Search Console
          </a>
          <a
            href="https://pagespeed.web.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm text-center"
          >
            PageSpeed
          </a>
          <a
            href="https://search.google.com/test/mobile-friendly"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors text-sm text-center"
          >
            Mobile Test
          </a>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
