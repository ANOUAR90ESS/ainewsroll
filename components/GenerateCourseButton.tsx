import React, { useState } from 'react';
import { BookOpen, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Tool } from '../types';

interface GenerateCourseButtonProps {
  tool: Tool;
  isAdmin?: boolean;
  className?: string;
}

const GenerateCourseButton: React.FC<GenerateCourseButtonProps> = ({
  tool,
  isAdmin = false,
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleGenerateCourse = async () => {
    if (!isAdmin) return;

    setIsGenerating(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateCourse',
          toolId: tool.id,
          toolName: tool.name,
          toolDescription: tool.description,
          category: tool.category,
          imageUrl: tool.imageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate course');
      }

      setStatus('success');

      // Redirect to course after 2 seconds
      setTimeout(() => {
        window.location.href = `/courses/${data.course.id}`;
      }, 2000);

    } catch (error: any) {
      console.error('Error generating course:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to generate course');

      // Reset error after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage('');
      }, 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="relative">
      <button
        onClick={handleGenerateCourse}
        disabled={isGenerating || status === 'success'}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          status === 'success'
            ? 'bg-green-600 text-white cursor-not-allowed'
            : status === 'error'
            ? 'bg-red-600 text-white hover:bg-red-500'
            : 'bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
        } ${className}`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Course...
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Course Created!
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle className="w-4 h-4" />
            Try Again
          </>
        ) : (
          <>
            <BookOpen className="w-4 h-4" />
            Generate Course
          </>
        )}
      </button>

      {/* Error Message */}
      {status === 'error' && errorMessage && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-red-900/90 border border-red-500 rounded-lg p-3 text-sm text-white z-10">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {status === 'success' && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-green-900/90 border border-green-500 rounded-lg p-3 text-sm text-white z-10">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Course generated successfully! Redirecting...</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-purple-900/90 border border-purple-500 rounded-lg p-3 text-sm text-white z-10">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Loader2 className="w-4 h-4 flex-shrink-0 mt-0.5 animate-spin" />
              <div>
                <div className="font-medium">Generating comprehensive course...</div>
                <div className="text-xs text-purple-300 mt-1">
                  AI is creating modules, lessons, and content. This may take 30-60 seconds.
                </div>
              </div>
            </div>
            <div className="w-full bg-purple-950 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-purple-400 animate-pulse" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateCourseButton;
