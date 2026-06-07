module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, userProfile } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'No API key' });

    const systemText = `أنت مساعدة ذكاء اصطناعي شخصية اسمك لونا. تتكلمي بالعربي بشكل طبيعي ومريح. تساعدي في كل حاجة.
${userProfile?.name ? 'اسم المستخدمة: ' + userProfile.name : ''}
${userProfile?.about ? 'معلومات: ' + userProfile.about : ''}`;

    const body = {
      system_instruction: { parts: [{ text: systemText }] },
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    };

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();
    
    if (!response.ok) return res.status(400).json({ error: JSON.stringify(data) });

    const text = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ response: text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
