import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, TrendingUp, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CourseContent {
  title: string;
  description: string;
  difficulty: string;
  estimated_duration: string;
  modules: Array<{
    id: number;
    title: string;
    lessons: any[];
  }>;
  summary: {
    total_modules: number;
    total_lessons: number;
  };
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

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tool_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDifficulty =
      difficultyFilter === 'all' || course.difficulty === difficultyFilter;

    return matchesSearch && matchesDifficulty;
  });

  const difficultyColors = {
    beginner: 'bg-green-500/20 text-green-300 border-green-500/30',
    intermediate: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    advanced: 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-zinc-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchCourses}
            className="mt-4 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-400" />
          <h1 className="text-3xl font-bold text-white">AI Tool Courses</h1>
        </div>
        <p className="text-zinc-400 text-lg">
          Comprehensive, AI-generated courses to master the best AI tools
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-3 text-sm text-zinc-400">
          Showing {filteredCourses.length} of {courses.length} courses
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-12 text-center">
          <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg mb-2">No courses found</p>
          <p className="text-zinc-500 text-sm">
            {searchQuery || difficultyFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Courses will appear here once they are generated'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="group bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-900/20 flex flex-col"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/30 to-purple-900/30">
                    <BookOpen className="w-12 h-12 text-indigo-400/50" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white border border-white/10">
                  {course.content.summary.total_lessons} Lessons
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${difficultyColors[course.difficulty as keyof typeof difficultyColors] || difficultyColors.beginner}`}>
                    {course.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <Clock className="w-3 h-3" />
                    {course.content.estimated_duration}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">
                  {course.title}
                </h3>

                <p className="text-zinc-400 text-sm mb-3 line-clamp-2 flex-1">
                  {course.description}
                </p>

                <div className="text-xs text-indigo-400 font-medium mb-3">
                  {course.tool_name}
                </div>

                {/* Module Count & Views */}
                <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-800">
                  <span>{course.content.summary.total_modules} Modules</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {course.view_count} views
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
