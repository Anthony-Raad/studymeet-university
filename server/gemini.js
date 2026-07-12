const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null;

export { GEMINI_API_KEY };

export async function geminiSummarize(transcript) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" +
    GEMINI_API_KEY;

  const prompt =
    "You are a helpful teaching assistant. Summarize this class meeting transcript " +
    "into 3 to 6 clear bullet points a student can understand. Keep it friendly and concise.\n\n" +
    "Transcript:\n" + transcript;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  if (
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0]
  ) {
    return data.candidates[0].content.parts[0].text;
  }

  return "No summary returned.";
}
