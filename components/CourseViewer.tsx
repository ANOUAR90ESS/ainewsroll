import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Clock, CheckCircle2, Lightbulb, ArrowLeft, ArrowRight } from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  duration: string;
  content: string;
  key_points: string[];
  tips?: string;
}

interface Module {
  id: number;
  title: string;
  description: string;
  icon: string;
  lessons: Lesson[];
}

interface CourseContent {
  title: string;
  description: string;
  difficulty: string;
  estimated_duration: string;
  learning_objectives: string[];
  prerequisites: string[];
  modules: Module[];
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

interface CourseViewerProps {
  course: Course;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ course }) => {
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [activeLesson, setActiveLesson] = useState<{ moduleId: number; lessonId: number }>({
    moduleId: 1,
    lessonId: 1
  });

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const selectLesson = (moduleId: number, lessonId: number) => {
    setActiveLesson({ moduleId, lessonId });
    if (!expandedModules.includes(moduleId)) {
      setExpandedModules(prev => [...prev, moduleId]);
    }
  };

  const getCurrentLesson = (): Lesson | null => {
    const module = course.content.modules.find(m => m.id === activeLesson.moduleId);
    if (!module) return null;
    return module.lessons.find(l => l.id === activeLesson.lessonId) || null;
  };

  const getNextLesson = (): { moduleId: number; lessonId: number } | null => {
    const currentModule = course.content.modules.find(m => m.id === activeLesson.moduleId);
    if (!currentModule) return null;

    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === activeLesson.lessonId);

    // Next lesson in same module
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      return {
        moduleId: activeLesson.moduleId,
        lessonId: currentModule.lessons[currentLessonIndex + 1].id
      };
    }

    // First lesson of next module
    const currentModuleIndex = course.content.modules.findIndex(m => m.id === activeLesson.moduleId);
    if (currentModuleIndex < course.content.modules.length - 1) {
      const nextModule = course.content.modules[currentModuleIndex + 1];
      if (nextModule.lessons.length > 0) {
        return {
          moduleId: nextModule.id,
          lessonId: nextModule.lessons[0].id
        };
      }
    }

    return null;
  };

  const getPreviousLesson = (): { moduleId: number; lessonId: number } | null => {
    const currentModule = course.content.modules.find(m => m.id === activeLesson.moduleId);
    if (!currentModule) return null;

    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === activeLesson.lessonId);

    // Previous lesson in same module
    if (currentLessonIndex > 0) {
      return {
        moduleId: activeLesson.moduleId,
        lessonId: currentModule.lessons[currentLessonIndex - 1].id
      };
    }

    // Last lesson of previous module
    const currentModuleIndex = course.content.modules.findIndex(m => m.id === activeLesson.moduleId);
    if (currentModuleIndex > 0) {
      const prevModule = course.content.modules[currentModuleIndex - 1];
      if (prevModule.lessons.length > 0) {
        return {
          moduleId: prevModule.id,
          lessonId: prevModule.lessons[prevModule.lessons.length - 1].id
        };
      }
    }

    return null;
  };

  const currentLesson = getCurrentLesson();
  const nextLesson = getNextLesson();
  const previousLesson = getPreviousLesson();

  const difficultyColors = {
    beginner: 'bg-green-500/20 text-green-300 border-green-500/30',
    intermediate: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    advanced: 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Course Header */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyColors[course.difficulty as keyof typeof difficultyColors] || difficultyColors.beginner}`}>
              {course.difficulty}
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400 text-sm">
              <Clock className="w-4 h-4" />
              {course.content.estimated_duration}
            </span>
            <span className="text-zinc-500 text-sm">
              {course.view_count} views
            </span>
          </div>

          <h1 className="text-3xl font-bold text-white">{course.content.title}</h1>
          <p className="text-zinc-300 text-lg">{course.content.description}</p>

          {/* Learning Objectives */}
          {course.content.learning_objectives && course.content.learning_objectives.length > 0 && (
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wide">Learning Objectives</h3>
              <ul className="space-y-1.5">
                {course.content.learning_objectives.map((objective, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prerequisites */}
          {course.content.prerequisites && course.content.prerequisites.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-zinc-400">Prerequisites:</span>
              {course.content.prerequisites.map((prereq, idx) => (
                <span key={idx} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full">
                  {prereq}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Module Navigation */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Course Content
            </h2>

            <div className="space-y-2">
              {course.content.modules.map(module => (
                <div key={module.id} className="border border-zinc-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 text-left">
                      <span className="text-lg">{module.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-white">{module.title}</div>
                        <div className="text-xs text-zinc-400">{module.lessons.length} lessons</div>
                      </div>
                    </div>
                    {expandedModules.includes(module.id) ? (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>

                  {expandedModules.includes(module.id) && (
                    <div className="bg-zinc-900/30">
                      {module.lessons.map(lesson => (
                        <button
                          key={lesson.id}
                          onClick={() => selectLesson(module.id, lesson.id)}
                          className={`w-full text-left p-3 border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors ${
                            activeLesson.moduleId === module.id && activeLesson.lessonId === lesson.id
                              ? 'bg-indigo-900/30 border-l-2 border-l-indigo-500'
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm text-zinc-300 flex-1">{lesson.title}</span>
                            <span className="text-xs text-zinc-500 flex-shrink-0">{lesson.duration}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Course Summary */}
          {course.content.summary && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Course Summary</h3>
              <div className="space-y-2 text-sm text-zinc-400">
                <div className="flex justify-between">
                  <span>Modules:</span>
                  <span className="text-white font-medium">{course.content.summary.total_modules}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lessons:</span>
                  <span className="text-white font-medium">{course.content.summary.total_lessons}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Lesson Display */}
        <div className="lg:col-span-2">
          {currentLesson ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-6">
              {/* Lesson Header */}
              <div>
                <div className="text-xs text-indigo-400 uppercase tracking-wide font-semibold mb-2">
                  Module {activeLesson.moduleId} · Lesson {activeLesson.lessonId}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{currentLesson.title}</h2>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Clock className="w-4 h-4" />
                  {currentLesson.duration}
                </div>
              </div>

              {/* Lesson Content */}
              <div className="prose prose-invert prose-zinc max-w-none">
                <div className="text-zinc-300 leading-relaxed whitespace-pre-line">
                  {currentLesson.content}
                </div>
              </div>

              {/* Key Points */}
              {currentLesson.key_points && currentLesson.key_points.length > 0 && (
                <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Key Points
                  </h3>
                  <ul className="space-y-2">
                    {currentLesson.key_points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                        <span className="text-indigo-400 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tips */}
              {currentLesson.tips && (
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-indigo-300 mb-1">Pro Tip</h3>
                      <p className="text-sm text-zinc-300">{currentLesson.tips}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                {previousLesson ? (
                  <button
                    onClick={() => selectLesson(previousLesson.moduleId, previousLesson.lessonId)}
                    className="flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous Lesson
                  </button>
                ) : (
                  <div />
                )}

                {nextLesson ? (
                  <button
                    onClick={() => selectLesson(nextLesson.moduleId, nextLesson.lessonId)}
                    className="flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Next Lesson
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Course Complete!
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8 text-center">
              <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400">Select a lesson to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Resources */}
      {course.content.resources && course.content.resources.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.content.resources.map((resource, idx) => (
              <div key={idx} className="bg-zinc-800/50 rounded-lg p-4">
                <div className="text-sm font-semibold text-white mb-1">{resource.title}</div>
                <div className="text-xs text-indigo-400 uppercase mb-2">{resource.type}</div>
                <div className="text-sm text-zinc-400">{resource.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Takeaways */}
      {course.content.summary?.key_takeaways && course.content.summary.key_takeaways.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Key Takeaways</h2>
          <ul className="space-y-2">
            {course.content.summary.key_takeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-3 text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CourseViewer;
