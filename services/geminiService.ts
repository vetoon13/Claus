
import { GoogleGenAI, GenerateContentResponse, Part, Type, Content } from "@google/genai";
import { AttachedFile, Suggestion, ChatMessage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToPart = (file: AttachedFile): Part => {
  return {
    inlineData: {
      mimeType: file.type,
      data: file.base64,
    },
  };
};

export const generateInitialContent = async (prompt: string, files: AttachedFile[]): Promise<string> => {
    try {
        const fileParts = files.map(fileToPart);
        const textPart = { text: prompt };
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [textPart, ...fileParts] },
            config: {
                systemInstruction: "You are a world-class writing assistant. Generate thoughtful, well-structured, and engaging content based on the user's prompt. Format your response in HTML using paragraphs, headings, and lists where appropriate."
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating initial content:", error);
        throw new Error("Failed to generate content");
    }
};

export const iterateOnSelection = async (fullText: string, selection: string, instruction: string): Promise<string> => {
    try {
        const prompt = `
        Here is a document:
        ---
        ${fullText}
        ---
        The user has selected the following text from the document: "${selection}"
        The user's instruction is: "${instruction}"
        
        Please rewrite ONLY the selected text based on the instruction. Return only the rewritten text, without any additional commentary or formatting.
        `;
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error iterating on selection:", error);
        throw new Error("Failed to iterate on selection");
    }
};

export const getProactiveSuggestions = async (fullText: string): Promise<Suggestion[]> => {
    if (fullText.trim().split(' ').length < 20) { // Don't run on very short text
        return [];
    }
    
    try {
        const prompt = `
        You are a proactive writing assistant. Analyze the following text for clarity, conciseness, tone, and grammar.
        Identify specific phrases or sentences that could be improved.
        For each identified part, provide the original text and a suggested replacement.
        Do not suggest changes for the entire text, only for specific, small parts.

        Text to analyze:
        ---
        ${fullText}
        ---
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    originalText: { type: Type.STRING },
                                    suggestedText: { type: Type.STRING },
                                },
                            },
                        },
                    },
                },
            },
        });
        
        const result = JSON.parse(response.text);
        return result.suggestions || [];
    } catch (error) {
        console.error("Error getting proactive suggestions:", error);
        return [];
    }
};


export const getChatResponse = async (history: ChatMessage[], newMessage: string): Promise<string> => {
    try {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: history.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            })),
        });

        const response = await chat.sendMessage({ message: newMessage });
        return response.text;

    } catch (error) {
        console.error("Error getting chat response:", error);
        throw new Error("Failed to get chat response");
    }
}
