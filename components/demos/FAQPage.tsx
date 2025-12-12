import React from 'react';
import { ChevronDown } from 'lucide-react';
import useSEO from '../../hooks/useSEO';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is AI News-Roll?',
    answer: 'AI News-Roll is a comprehensive platform that aggregates the latest AI tools, news, and developments in artificial intelligence. We provide curated tools, real-time news updates, and insights powered by Google Gemini.'
  },
  {
    question: 'Is AI News-Roll free to use?',
    answer: 'Yes! AI News-Roll is completely free to access. You can browse our tool directory and read the latest AI news without any subscription required.'
  },
  {
    question: 'What AI tools are featured on AI News-Roll?',
    answer: 'We feature a wide variety of AI tools including ChatGPT alternatives, image generators, video creation tools, productivity apps, and more. Our directory is regularly updated with the latest releases.'
  },
  {
    question: 'Can I suggest new AI tools?',
    answer: 'Absolutely! We love community contributions. Contact us through our Contact page to suggest new tools you\'d like to see featured on AI News-Roll.'
  },
  {
    question: 'How often is the AI news updated?',
    answer: 'Our news section is updated multiple times daily to ensure you stay informed about the latest developments in artificial intelligence and machine learning.'
  },
  
  {
    question: 'Is my data private on AI News-Roll?',
    answer: 'Yes, your privacy is important to us. We use secure authentication and do not share your data with third parties. Please review our Privacy Policy for more details.'
  },
  {
    question: 'How do I report a broken link or issue?',
    answer: 'You can report issues through our Contact page. We take feedback seriously and work quickly to address any problems.'
  }
];

const FAQPage: React.FC = () => {
  useSEO({
    title: 'Frequently Asked Questions - AI News-Roll',
    description: 'Find answers to common questions about AI News-Roll, our tools, features, and services.',
    keywords: 'FAQ, AI News-Roll, help, support, artificial intelligence'
  });

  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-zinc-400">
          Find answers to common questions about AI News-Roll and how to use our platform.
        </p>
      </div>

      <div className="space-y-4">
        {FAQ_ITEMS.map((item, index) => {
          const isExpanded = expandedIndex === index;
          const buttonId = `faq-button-${index}`;
          const panelId = `faq-panel-${index}`;

          return (
          <div
            key={index}
            className="border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors"
          >
            <button
              id={buttonId}
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-900/50 transition-colors text-left"
              aria-expanded={isExpanded}
              aria-controls={panelId}
            >
              <h3 className="font-semibold text-white pr-4">{item.question}</h3>
              <ChevronDown
                className={`w-5 h-5 text-indigo-400 flex-shrink-0 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isExpanded && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="px-6 py-4 bg-zinc-900/30 border-t border-zinc-800 text-zinc-300"
              >
                {item.answer}
              </div>
            )}
          </div>
        )})}
      </div>

      {/* FAQ Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': FAQ_ITEMS.map(item => ({
            '@type': 'Question',
            'name': item.question,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': item.answer
            }
          }))
        })}
      </script>

      <div className="mt-12 p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg">
        <h2 className="text-xl font-bold mb-2 text-white">Didn't find what you're looking for?</h2>
        <p className="text-zinc-400 mb-4">
          Have a question that's not answered here? Contact our support team through the Contact page.
        </p>
      </div>
    </div>
  );
};

export default FAQPage;
