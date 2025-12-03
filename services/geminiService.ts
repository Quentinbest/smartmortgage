import { GoogleGenAI } from "@google/genai";
import { Loan, SimulationResult } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY; 
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getFinancialAdvice = async (
  loans: Loan[],
  cashOnHand: number,
  safetyBuffer: number,
  investmentYield: number,
  simulationA: SimulationResult,
  simulationB: SimulationResult,
  language: string
): Promise<string> => {
  const client = getClient();
  if (!client) return "API Key not configured. Please check your environment settings.";

  const totalDebt = loans.reduce((acc, l) => acc + l.balance, 0);
  const weightedRate = loans.reduce((acc, l) => acc + (l.rate * l.balance), 0) / totalDebt;

  const langPrompt = language === 'zh-CN' ? 'Please answer in Simplified Chinese (zh-CN).' : 
                     language === 'zh-TW' ? 'Please answer in Traditional Chinese (zh-TW).' : 
                     'Please answer in English.';

  const prompt = `
    Context: A user in China is deciding on early mortgage repayment.
    
    Data:
    - Total Loans: ¥${totalDebt.toFixed(2)}
    - Weighted Interest Rate: ${weightedRate.toFixed(2)}%
    - Cash on Hand: ¥${cashOnHand}
    - User Selected Safety Buffer: ¥${safetyBuffer}
    - Repayment Amount Considered: ¥${cashOnHand - safetyBuffer}
    - User's Alternative Investment Yield: ${investmentYield}%
    
    Simulation Results:
    - Strategy A (Shorten Term): Saves ¥${simulationA.totalSaved.toFixed(0)} in interest.
    - Strategy B (Reduce Payment): Reduces monthly payment to ¥${simulationB.monthlyPayment.toFixed(0)}.

    Task:
    Act as a financial expert. Provide a concise 3-paragraph analysis:
    1. Compare the Loan Rate vs Investment Yield (Opportunity Cost). Recommendation on Repay vs Invest.
    2. Analyze the trade-off between Strategy A (Wealth/Interest Saving) and Strategy B (Cash Flow).
    3. Mention if the "Safety Buffer" seems adequate based on general rules of thumb (3-6 months expenses).

    ${langPrompt}
    Format the output in Markdown. Be professional but encouraging.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate advice.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I am currently unable to provide advice. Please try again later.";
  }
};