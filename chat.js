export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, userProfile } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const systemInstruction = `أنت مساعدة ذكاء اصطناعي شخصية ومخلصة. اسمك "لونا".
أنتِ ذكية، دافئة، وصادقة. بتتكلمي بالعربي بشكل طبيعي ومريح.
بتساعدي في كل حاجة: أسئلة، دراسة، شغل، أفكار، أو مجرد دردشة.
بتتذكري كل حاجة بتقولها المستخدمة وبتوظفيها في ردودك.
ردودك واضحة ومختصرة إلا لو طُلب منك التفصيل.
${userProfile?.name ? `اسم المستخدمة: ${userProfile.name}` : ''}
${userProfile?.about ? `معلومات عنها: ${userProfile.about}` : ''}
${userProfile?.preferences ? `تفضيلاتها: ${userProfile.preferences}` : ''}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          generationConfig: { temperature: 0.8, maxOutputTokens: 1000 }
        })
      }
    );

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'مفيش رد';
    return res.status(200).json({ response: text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
