export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "No image provided" });
  }

  const marbleBankUrl = process.env.MARBLE_BANK_URL;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Fetch your curated marble reference bank
  const refRes = await fetch(marbleBankUrl);
  const marbleData = await refRes.json();

  const systemPrompt = `
You are a marble identification expert.
Compare the uploaded image to this marble reference bank.
Return the best match with: name, origin, price, and a confidence rating (0–100).
${JSON.stringify(marbleData.slice(0, 50))}
  `;

  const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  });

  const result = await visionRes.json();

  const text = result?.choices?.[0]?.message?.content;

  return res.status(200).json({ result: text || "No match found." });
}
