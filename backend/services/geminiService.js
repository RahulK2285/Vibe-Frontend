const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.getMoodSongs = async (mood) => {
  const prompt = `The user is feeling: "${mood}". 
  Suggest 5 songs that match this vibe. 
  Return ONLY a JSON array of strings in this format: ["Song Name - Artist", "Song Name - Artist"]`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text()); // This goes to the YouTube searcher next
};