import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { mensaje, contexto_usuario, conversacion_historia = [] } = req.body;
    const system_prompt = `
Sos el Sales Coach AI de ${contexto_usuario.nombre || 'el usuario'}.

TU PERSONALIDAD:
- Argentino, directo, práctico
- Experto en ventas B2B/B2C
- Celebrás logros, alertás problemas
- No bullshit, al grano

CONTEXTO USUARIO:
- Negocio: ${contexto_usuario.negocio}
- ICP: ${contexto_usuario.icp_principal}

TU TRABAJO:
1. Conversar naturalmente
2. Ayudar con estrategia comercial
3. Dar recomendaciones prácticas
4. Analizar situación y optimizar

Usuario dice: "${mensaje}"

Responde conversacionalmente, claro, directo, argentino.
`;
    const messages = [
      { role: 'system', content: system_prompt },
      ...conversacion_historia.slice(-10),
      { role: 'user', content: mensaje }
    ];
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500
    });
    const respuesta = completion.choices[0].message.content;
    res.status(200).json({
      respuesta: respuesta,
      tokens_used: completion.usage.total_tokens
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Error procesando mensaje',
      details: error.message 
    });
  }
}
