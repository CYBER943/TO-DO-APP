import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const suggestSubtasks = async (taskTitle: string, taskDescription?: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 3-5 practical subtasks for the following task: "${taskTitle}" ${taskDescription ? `(Description: ${taskDescription})` : ""}. Return only a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    return [];
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    return [];
  }
};

export const suggestPrioritization = async (tasks: Task[]): Promise<{ taskId: string; reason: string }[]> => {
  try {
    const taskList = tasks.map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority }));
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Given these tasks, suggest which 3 should be prioritized today and why. Tasks: ${JSON.stringify(taskList)}. Return a JSON array of objects with taskId and reason.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              taskId: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ["taskId", "reason"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    return [];
  } catch (error) {
    console.error("Error getting prioritization suggestions:", error);
    return [];
  }
};
