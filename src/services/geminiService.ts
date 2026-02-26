import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getWorkoutSuggestions(pastLogs: any[], currentSchedule: any[]) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Based on the user's past workout logs and current schedule, suggest 3 new exercises or a routine adjustment.
    Focus on muscle groups they haven't trained recently or exercises they haven't performed in a while.
    
    Current Schedule: ${JSON.stringify(currentSchedule)}
    Past Logs (last 30 days): ${JSON.stringify(pastLogs.slice(0, 50))}
    
    Return the suggestions in a clear JSON format with:
    - title: name of the exercise/routine
    - reason: why this is suggested
    - muscleGroup: the target muscle group
    - sets: suggested sets
    - reps: suggested reps
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reason: { type: Type.STRING },
              muscleGroup: { type: Type.STRING },
              sets: { type: Type.NUMBER },
              reps: { type: Type.STRING }
            },
            required: ["title", "reason", "muscleGroup", "sets", "reps"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}
