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

export async function geminiAnswerQuestion(summary, question) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" +
    GEMINI_API_KEY;

  const prompt =
    "You are a helpful teaching assistant. A student is looking at the following class summary " +
    "and has a question about it. Answer clearly and simply, using the summary as your main context. " +
    "If the summary does not contain the answer, say so honestly.\n\n" +
    "Summary:\n" + summary + "\n\n" +
    "Student question:\n" + question;

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

  return "No answer returned.";
}

export async function geminiMakeQuiz(summary) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" +
    GEMINI_API_KEY;

  const prompt =
    "You are a helpful teaching assistant. Based on this class summary, write 5 multiple choice " +
    "questions that test if a student understood the class. Use exactly this format for each question, " +
    "with a blank line between questions and nothing else in your reply:\n\n" +
    "Q: question text\n" +
    "A: first option\n" +
    "B: second option\n" +
    "C: third option\n" +
    "D: fourth option\n" +
    "CORRECT: A\n\n" +
    "The line after CORRECT: must be only the single letter A, B, C or D.\n\n" +
    "Summary:\n" + summary;

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

  return "";
}
