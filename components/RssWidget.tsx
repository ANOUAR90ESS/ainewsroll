import React, { useEffect } from 'react';

interface RssWidgetProps {
  widgetId?: string;
  className?: string;
}

const RssWidget: React.FC<RssWidgetProps> = ({
  widgetId = '7IXKQzxknDfEuBCS',
  className = 'w-full my-6 overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800 p-2'
}) => {
  useEffect(() => {
    const scriptUrl = 'https://widget.rss.app/v1/magazine.js';
    let script = document.querySelector(`script[src="${scriptUrl}"]`) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.src = scriptUrl;
      script.type = 'text/javascript';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className={className}>
      {React.createElement('rssapp-magazine', { id: widgetId })}
    </div>
  );
};

export default RssWidget;
