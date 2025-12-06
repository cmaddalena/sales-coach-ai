import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { persona, contexto } = req.body;
    const prompt = `
Genera speech personalizado para LinkedIn.

Persona: ${JSON.stringify(persona)}
Contexto: ${JSON.stringify(contexto)}

Reglas:
- Máximo 5 líneas
- Tono argentino coloquial
- Si hay conexión común, mencionarla
- Pain point específico
- Resultado concreto con número
- CTA: "15 min call"

Output SOLO el speech.
`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 300
    });
    res.status(200).json({
      speech: completion.choices[0].message.content.trim()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
