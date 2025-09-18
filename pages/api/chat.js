export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const { message } = req.body || {};
  if (!message) return res.status(400).json({error: 'No message'});

  try {
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return res.status(500).json({error:'OpenAI key not set'});

    const payload = {
      model: 'gpt-4o-mini',
      messages: [{role:'user', content: message}],
      temperature: 0.7,
      max_tokens: 800
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content || '';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
    }
    
