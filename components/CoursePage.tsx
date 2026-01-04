import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import CourseViewer from './CourseViewer';

interface CourseContent {
  title: string;
  description: string;
  difficulty: string;
  estimated_duration: string;
  learning_objectives: string[];
  prerequisites: string[];
  modules: Array<{
    id: number;
    title: string;
    description: string;
    icon: string;
    lessons: any[];
  }>;
  summary: {
    total_modules: number;
    total_lessons: number;
    key_takeaways: string[];
  };
  resources?: Array<{
    title: string;
    type: string;
    description: string;
  }>;
}

interface Course {
  id: string;
  tool_name: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_duration: string;
  content: CourseContent;
  thumbnail_url?: string;
  view_count: number;
  created_at: string;
}

const CoursePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
    }
  }, [courseId]);

  const fetchCourse = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getCourse',
          id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }

      const data = await response.json();
      setCourse(data.course);
    } catch (err: any) {
      console.error('Error fetching course:', err);
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Link>
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 text-center">
          <p className="text-red-300 mb-4">{error || 'Course not found'}</p>
          <Link
            to="/courses"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Browse All Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto p-6">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Link>
      </div>
      <CourseViewer course={course} />
    </div>
  );
};

export default CoursePage;
