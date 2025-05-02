export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Image is required" });
  }

  try {
    const marbleBankUrl = process.env.MARBLE_BANK_URL;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Fetch marble reference bank
    const refRes = await fetch(marbleBankUrl);
    const marbleData = await refRes.json();

    // Build OpenAI prompt with your bank
    const systemPrompt = `
You are a marble identification expert.
Your job is to match a photo of a marble slab to the most likely marble from this list.
Each entry includes: name, origin, price, rarity, and best use.
Return: the closest match, estimated confidence, and brief explanation.

Marble Reference Bank: ${JSON.stringify(marbleData.slice(0, 30))}
    `;

    // GPT-4 Vision call
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    const result = await openaiRes.json();
    const message = result?.choices?.[0]?.message?.content;

    return res.status(200).json({ match: message || "No match found." });
  } catch (err) {
    console.error("Error in marble-match handler:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
