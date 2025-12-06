import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { contexto, tipo } = req.body;
    const prompt = `
Analiza contexto y genera recomendaciones.

Tipo análisis: ${tipo}
Contexto: ${JSON.stringify(contexto)}

Devuelve JSON con insights accionables.
`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });
    res.status(200).json(
      JSON.parse(completion.choices[0].message.content)
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
