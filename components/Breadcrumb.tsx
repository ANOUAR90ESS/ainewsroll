import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { AppView } from '../types';

interface BreadcrumbItem {
  label: string;
  view?: AppView;
  pageId?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (view: AppView, pageId?: string) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onNavigate }) => {
  return (
    <nav className="flex items-center gap-2 text-sm text-zinc-400 mb-6 px-4 md:px-6" aria-label="Breadcrumb">
      <button
        onClick={() => onNavigate(AppView.HOME)}
        className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
        title="Home"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Home</span>
      </button>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-zinc-600" />
          {item.view ? (
            <button
              onClick={() => onNavigate(item.view!, item.pageId)}
              className="hover:text-indigo-400 transition-colors"
              title={item.label}
            >
              {item.label}
            </button>
          ) : (
            <span className="text-zinc-300" aria-current="page">
              {item.label}
            </span>
          )}
        </div>
      ))}

      {/* Schema markup for breadcrumbs */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Home',
              'item': 'https://ainewsroll.space'
            },
            ...items.map((item, index) => ({
              '@type': 'ListItem',
              'position': index + 2,
              'name': item.label,
              'item': `https://ainewsroll.space${item.view ? `?view=${item.view}` : ''}${item.pageId ? `&id=${item.pageId}` : ''}`
            }))
          ]
        })}
      </script>
    </nav>
  );
};

export default Breadcrumb;
