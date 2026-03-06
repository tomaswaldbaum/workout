
import { GoogleGenAI } from "@google/genai";
import { CELData } from "./types";

export const getAISummary = async (data: CELData): Promise<string> => {
  // Always use process.env.API_KEY directly for initialization as per @google/genai guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Act as a senior cyber security analyst. Based on the following Context Explanation Layer (CEL) data, 
    provide a concise executive summary of the threat actor campaign. 
    Highlight the strongest evidence, the top drivers for the confidence score, 
    and suggest 3 priority hunting or mitigation actions.

    CEL Data:
    - Confidence: ${data.confidenceScore} (${data.confidenceBand})
    - Top Drivers: ${data.drivers.join(', ')}
    - Incident Count: ${data.incidentCount}
    - Major TTPs: ${data.evidence.ttps.map(t => t.name).join(', ')}
    - Infrastructure: ${data.evidence.infrastructure.map(i => i.name).join(', ')}
    - Kill Chain Continuity: ${data.killChain.continuity.map(c => `${c.transition} (${c.confidence})`).join(', ')}

    Keep the summary professional, technical but accessible, and less than 200 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use the .text property directly, it's a property not a method
    return response.text || "Failed to generate AI summary.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "Error communicating with AI Analyst.";
  }
};
