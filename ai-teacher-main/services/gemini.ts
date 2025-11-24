import { GoogleGenAI, Type } from "@google/genai";
import { Course } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// We use a faster model for the structure
const SYLLABUS_MODEL = 'gemini-2.5-flash';
// We use a capable model for teaching
const TEACHER_MODEL = 'gemini-2.5-flash'; 

export const generateSyllabus = async (topic: string): Promise<Course> => {
  try {
    const response = await ai.models.generateContent({
      model: SYLLABUS_MODEL,
      contents: `Create a comprehensive course syllabus for learning about: "${topic}". 
      The course should be broken down into 4-6 logical modules. 
      Ensure the title is catchy and the description is motivating.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The title of the course" },
            description: { type: Type.STRING, description: "A short, engaging description of the course outcomes" },
            modules: {
              type: Type.ARRAY,
              description: "List of modules",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Module title" },
                  description: { type: Type.STRING, description: "What will be covered in this module" }
                },
                required: ["title", "description"]
              }
            }
          },
          required: ["title", "description", "modules"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        id: crypto.randomUUID(),
        topic,
        title: data.title,
        description: data.description,
        modules: data.modules.map((m: any) => ({
          id: crypto.randomUUID(),
          title: m.title,
          description: m.description,
          isCompleted: false
        })),
        createdAt: Date.now()
      };
    }
    throw new Error("No content generated");
  } catch (error) {
    console.error("Error generating syllabus:", error);
    throw error;
  }
};

export const streamLessonContent = async function* (courseTitle: string, moduleTitle: string, moduleDescription: string) {
  const prompt = `
    You are an expert and engaging teacher. You are teaching the module "${moduleTitle}" from the course "${courseTitle}".
    
    Module Description: ${moduleDescription}

    PART 1: THE LESSON
    Structure your lesson in valid Markdown.
    - Introduction
    - Core Concepts (Explain clearly, use analogies)
    - Examples/Code (if technical)
    - Summary

    PART 2: THE QUIZ
    After the lesson, you MUST output a separator string exactly like this: "---QUIZ_START---"
    Immediately after the separator, provide a valid JSON array of 3-5 objects representing multiple-choice questions.
    Do NOT wrap the JSON in markdown code blocks. Just raw JSON text after the separator.
    
    JSON Format per question:
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": number (0-3 index of the correct option),
      "explanation": "string (brief explanation of why)"
    }

    Tone: Enthusiastic, clear, and encouraging.
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: TEACHER_MODEL,
      contents: prompt,
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Error streaming lesson:", error);
    throw error;
  }
};