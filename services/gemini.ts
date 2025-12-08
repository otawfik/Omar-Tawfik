import { GoogleGenAI, Type } from "@google/genai";
import { PlanetName } from "../types";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

export const generateBriefing = async (planet: PlanetName): Promise<{ title: string; mission: string }> => {
  try {
    const prompt = `Generate a short, intense sci-fi mission briefing for a mini-game set on ${planet}.
    
    The game context is:
    - Mercury: Bullet-hell survival. Dodging solar flares erupting from the sun while piloting a probe.
    - Venus: Piloting a probe upward to escape acid clouds and high pressure.
    - Earth: Defending a space station from space debris/junk using a rotating shield.
    - Mars: Driving a rover in a dust storm with drift physics to find water samples.
    - Jupiter: Using gravity assists (orbits) to collect data from moons without falling in.
    - Saturn: High-speed flight through the ring system dodging ice asteroids.
    - Uranus: Piloting a harvester drone at the bottom of the cloud layer to catch falling gas samples while avoiding ice rocks.
    - Neptune: Fighting supersonic winds to catch diamond rain.

    Return JSON with 'title' (short catchy name) and 'mission' (2 sentences commanding the player).`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            mission: { type: Type.STRING }
          },
          required: ["title", "mission"]
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No text returned");
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Briefing Error:", error);
    return {
      title: `${planet} Mission`,
      mission: "Prepare for planetary exploration. Survive the elements!"
    };
  }
};

export const generateFact = async (planet: PlanetName, won: boolean): Promise<string> => {
  try {
    const prompt = `Generate a fascinating, single-sentence scientific fact about ${planet}. 
    ${won ? "Start with a celebratory tone." : "Start with an encouraging tone for a failed mission."}
    Focus on the specific physics used in the game:
    - Mercury: Solar flares/Proximity to Sun
    - Venus: Atmospheric pressure/Acid
    - Earth: Orbital debris (Kessler syndrome)
    - Mars: Dust storms/Terrain
    - Jupiter: Gravity/Mass
    - Saturn: Ring composition/Density
    - Uranus: Methane atmosphere/Ice composition
    - Neptune: Wind speeds/Diamond rain`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "text/plain",
      }
    });

    return response.text || `Mission complete. ${planet} is a fascinating world.`;
  } catch (error) {
    console.error("Gemini Fact Error:", error);
    return `Did you know? ${planet} has unique environmental challenges.`;
  }
};