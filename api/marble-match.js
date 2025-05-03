export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Image is required" });
  }

  try {
    const marbleBankUrl = process.env.MARBLE_BANK_URL;
    const openaiKey = process.env.OPENAI_API_KEY;

    const refRes = await fetch(marbleBankUrl);
    const marbleData = await refRes.json();

    const systemPrompt = `
You are a marble identification expert trained in Italian and exotic slabs.
You will receive an image of a marble slab. Compare it visually and stylistically to this marble reference bank. Marble Reference Bank (with image links):
${JSON.stringify(marbleData.slice(0, 50))}
If no good match, say: “No strong match. This may require human verification.”
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
  {
    role: "system",
    content: systemPrompt
  },
  {
    role: "user",
    content: [
      { type: "text", text: "What marble is this?" },
      { type: "image_url", image_url: { url: base64Image } }
    ]
  }
]
        max_tokens: 1000,
      }),
    });

    const result = await openaiRes.json();
    const message = result?.choices?.[0]?.message?.content;

    return res.status(200).json({ match: message || "No match found." });
  } catch (err) {
    console.error("❌ API Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
