import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }
  return new GoogleGenAI({ apiKey });
};

const cleanJSON = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

interface LessonContent {
  script: string;
  visualContent?: {
    keyPoints: string[];
    codeSnippet?: string;
    imagePrompt?: string;
  };
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

interface ModuleContent {
  title: string;
  description: string;
  icon: string;
  lessons: Array<{
    title: string;
    duration: string;
  } & LessonContent>;
}

interface CourseStructure {
  title: string;
  description: string;
  difficulty: string;
  estimated_duration: string;
  learning_objectives: string[];
  prerequisites: string[];
  modules: ModuleContent[];
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

// Generate content for specific lessons in a module
const generateModuleContent = async (
  topic: string,
  toolName: string,
  moduleTitle: string,
  lessonTitles: string[]
): Promise<LessonContent[]> => {
  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Context: Educational course about "${toolName}" - ${topic}.
        Module: "${moduleTitle}".
        Lessons to generate content for: ${JSON.stringify(lessonTitles)}.

        Task: Generate detailed educational content for each lesson.

        Requirements per lesson:
        1. Script: Engaging, educational content (150-250 words) explaining the topic clearly.
        2. Visual Content:
           - 3-4 concise key points (bullet points).
           - A specific "imagePrompt" describing an educational diagram/illustration.
           - Optional "codeSnippet" if technical content applies.
        3. Quiz: A multiple-choice question to test understanding.
           - Question text.
           - 4 options.
           - Correct option index (0-3).
           - Brief explanation of the correct answer.

        Return JSON with a "lessons" array containing exactly ${lessonTitles.length} items.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lessons: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  script: { type: Type.STRING },
                  visualContent: {
                    type: Type.OBJECT,
                    properties: {
                      keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                      codeSnippet: { type: Type.STRING },
                      imagePrompt: { type: Type.STRING }
                    }
                  },
                  quiz: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING }
                    }
                  }
                },
                required: ['script']
              }
            }
          },
          required: ['lessons']
        }
      }
    });

    const jsonStr = cleanJSON(response.text || "{}");
    const data = JSON.parse(jsonStr);
    return data.lessons || [];
  } catch (error) {
    console.error(`Error generating content for module ${moduleTitle}:`, error);
    return lessonTitles.map(() => ({
      script: "Content generation failed for this lesson. Please try regenerating.",
      visualContent: {
        keyPoints: ["Content temporarily unavailable"],
        imagePrompt: "Educational icon"
      }
    }));
  }
};

export const generateCourseWithGemini = async (
  toolName: string,
  toolDescription: string,
  category: string
): Promise<CourseStructure> => {
  const ai = getAI();

  console.log(`🎓 [Gemini] Step 1: Generating course outline for ${toolName}...`);

  // STEP 1: Generate Course Outline
  const outlineResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a comprehensive course outline for: "${toolName}".

    Tool Description: ${toolDescription}
    Category: ${category}

    Requirements:
    - Exactly 4 modules with clear progression
    - 2-4 lessons per module
    - Appropriate difficulty level (beginner/intermediate/advanced)
    - 4-5 learning objectives
    - 2-3 prerequisites
    - Estimated total duration (e.g., "2-3 hours")
    - 3 key takeaways
    - 2-3 additional resources

    Return a JSON structure with title, description, difficulty, modules (with titles and lesson titles only), etc.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          difficulty: { type: Type.STRING, enum: ['beginner', 'intermediate', 'advanced'] },
          estimated_duration: { type: Type.STRING },
          learning_objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
          prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
          modules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                icon: { type: Type.STRING },
                lessons: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      duration: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          },
          key_takeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
          resources: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          }
        },
        required: ['title', 'description', 'difficulty', 'modules']
      }
    }
  });

  const outlineJson = cleanJSON(outlineResponse.text || "{}");
  let outline;
  try {
    outline = JSON.parse(outlineJson);
  } catch (e) {
    console.error('❌ [Gemini] Failed to parse outline JSON:', e);
    throw new Error("Failed to generate course outline. Please try again.");
  }

  console.log(`✅ [Gemini] Step 1 complete: Outline generated with ${outline.modules?.length || 0} modules`);

  // STEP 2: Generate detailed content for each module in parallel
  console.log('🎓 [Gemini] Step 2: Generating detailed lesson content...');

  const modulesWithContent = await Promise.all(
    (outline.modules || []).map(async (mod: any, idx: number) => {
      const lessonTitles = mod.lessons?.map((l: any) => l.title) || [];
      const lessonDurations = mod.lessons?.map((l: any) => l.duration) || [];

      console.log(`  📚 Generating content for Module ${idx + 1}: ${mod.title}`);

      const content = await generateModuleContent(
        toolDescription,
        toolName,
        mod.title,
        lessonTitles
      );

      return {
        title: mod.title,
        description: mod.description || `Learn about ${mod.title}`,
        icon: mod.icon || '📖',
        lessons: lessonTitles.map((title: string, index: number) => ({
          id: index + 1,
          title: title,
          duration: lessonDurations[index] || '10 min',
          content: content[index]?.script || "Content not available.",
          key_points: content[index]?.visualContent?.keyPoints || [],
          tips: content[index]?.quiz?.explanation || undefined
        }))
      };
    })
  );

  console.log('✅ [Gemini] Step 2 complete: All lesson content generated');

  const totalLessons = modulesWithContent.reduce((sum, mod) => sum + mod.lessons.length, 0);

  return {
    title: outline.title || `Mastering ${toolName}`,
    description: outline.description || `A comprehensive course on ${toolName}`,
    difficulty: outline.difficulty || 'beginner',
    estimated_duration: outline.estimated_duration || '2-3 hours',
    learning_objectives: outline.learning_objectives || [],
    prerequisites: outline.prerequisites || ['Basic computer skills'],
    modules: modulesWithContent,
    summary: {
      total_modules: modulesWithContent.length,
      total_lessons: totalLessons,
      key_takeaways: outline.key_takeaways || []
    },
    resources: outline.resources || []
  };
};
