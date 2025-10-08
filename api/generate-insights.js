// api/generate-insights.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Access the API key from environment variables for security
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Vercel Serverless Function to generate financial insights using Google Gemini.
 */
export default async function handler(request, response) {
  // Ensure we're dealing with a POST request
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end('Method Not Allowed');
  }

  try {
    const { transactions } = request.body;

    // Basic validation
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return response.status(400).json({ error: 'Invalid or missing transactions data.' });
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create a detailed prompt for financial analysis
    const transactionsText = transactions.map(t =>
        `- ${t.type === 'income' ? 'Receita' : 'Despesa'} de R$${t.value.toFixed(2)} em ${t.date} (${t.type === 'expense' ? `categoria: ${t.category}, ` : ''}pagamento: ${t.paymentMethod})`
    ).join('\\n');

    const prompt = `
      Você é um assistente financeiro amigável e especialista chamado "Ferrari Manauara AI".
      Analise a seguinte lista de transações financeiras de um usuário brasileiro.

      Transações:
      ${transactionsText}

      Sua tarefa é fornecer uma análise clara, concisa e acionável em português do Brasil.
      Sua resposta DEVE ser formatada em HTML, usando as seguintes tags: <p>, <strong>, <ul>, e <li>. Não use outras tags HTML.

      Sua análise deve incluir os seguintes pontos:
      1.  **Resumo Geral:** Comece com um parágrafo amigável resumindo a saúde financeira geral com base nos dados.
      2.  **Ponto Positivo:** Destaque um hábito financeiro positivo observado (ex: boa quantidade de receitas, gastos controlados em uma área, etc.).
      3.  **Ponto de Melhoria:** Identifique a principal área onde o usuário pode melhorar (ex: gasto excessivo em uma categoria, muitas despesas pequenas, etc.).
      4.  **Sugestão Acionável:** Forneça uma dica prática e específica que o usuário pode implementar para melhorar suas finanças com base no ponto de melhoria.

      Exemplo de formato de resposta:
      <p><strong>Análise Geral:</strong> Olá! Analisei suas finanças e aqui estão alguns insights...</p>
      <p><strong>Ponto Positivo:</strong> Parabéns! Vi que suas receitas superaram bem suas despesas...</p>
      <p><strong>Ponto de Melhoria:</strong> Notei que a categoria "Comida" representa uma parte significativa de seus gastos...</p>
      <p><strong>Sugestão Acionável:</strong> Que tal tentar planejar as refeições da semana? Isso pode ajudar a reduzir os gastos com delivery...</p>
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const aiResponse = await result.response;
    const insightText = aiResponse.text();

    response.status(200).json({ insight: insightText });

  } catch (error) {
    console.error('Error generating insights with Gemini:', error);
    // Provide a more user-friendly error message
    response.status(500).json({ error: 'Ocorreu um erro ao conectar com o serviço de IA. Verifique se a chave de API está configurada corretamente no servidor e tente novamente.' });
  }
}
