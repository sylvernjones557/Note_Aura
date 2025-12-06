import { GoogleGenAI, Type } from "@google/genai";
import { Task, Note } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to generate a random ID (mimicking the one used in App logic)
const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Suggests tasks based on the list name and existing tasks context.
 */
export const suggestTasksWithAI = async (listName: string, existingTasks: string[]): Promise<Task[]> => {
  if (!apiKey) {
    console.warn("Gemini API Key is missing.");
    return [];
  }

  try {
    const prompt = `I have a to-do list named "${listName}". 
    The current tasks are: ${existingTasks.join(', ')}.
    Please suggest 3-5 new, relevant, and actionable tasks to add to this list.
    Keep them concise.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The task description" }
            },
            required: ["text"]
          }
        }
      }
    });

    const generatedTexts: { text: string }[] = JSON.parse(response.text || "[]");

    return generatedTexts.map(item => ({
      id: generateId(),
      text: item.text,
      completed: false,
      createdAt: Date.now()
    }));

  } catch (error) {
    console.error("Error generating tasks with Gemini:", error);
    throw error;
  }
};

/**
 * Improves or expands a note based on its current content.
 */
export const improveNoteWithAI = async (currentContent: string, instruction: string): Promise<string> => {
  if (!apiKey) {
    console.warn("Gemini API Key is missing.");
    return currentContent;
  }

  try {
    const prompt = `
      Original Note Content: "${currentContent}"
      
      Instruction: ${instruction}
      
      Please rewrite the note content based on the instruction. Return ONLY the new content string.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster edits
      }
    });

    return response.text || currentContent;
  } catch (error) {
    console.error("Error improving note with Gemini:", error);
    throw error;
  }
};