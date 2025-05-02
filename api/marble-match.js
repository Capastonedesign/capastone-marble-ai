module.exports = async function handler(req, res) {
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

    // ✅ Await is now inside the async handler
    const refRes = await fetch(marbleBankUrl);
    const marbleData = await refRes.json();

    const systemPrompt = `
You are a marble identification expert trained in Italian and exotic stone types.

You will receive an image of a marble slab. Compare it visually and stylistically to the following marble bank, which includes reference images, price, and traits.

Match the image to the most visually similar marble. Focus on:
- Vein direction (linear, webbed, clustered)
- Contrast (low vs high)
- Color (white, grey, gold, purple)
- Pattern (egg-shaped clusters, clouds, lightning veins)

Then return:
- Marble Name
- Origin
- Price Range
- Rarity
- Pattern Description (1 line)
- Why it matches (1 paragraph)
- Match confidence score (0–100)

If the match is uncertain, include: “This result is our best guess. We recommend confirming via consultation.”

Marble Reference Bank:
${JSON.stringify(marbleData.slice(0, 30))}

Be concise, accurate, and confident.
`;

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
    console.error("🔥 Error in marble-match handler:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};
