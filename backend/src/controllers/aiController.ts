import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const SYSTEM_PROMPT = `You are a helpful and knowledgeable tax advisor specializing in freelancers, independent contractors, and self-employed professionals in the United States.

Your role is to:
- Explain tax deductions in plain English (avoid jargon)
- Help identify legitimate business deductions
- Explain quarterly estimated tax payments
- Suggest tax-saving strategies for freelancers
- Reference IRS guidelines when relevant

Always include this disclaimer when giving specific tax advice: "Note: This is general guidance, not professional tax advice. For complex situations, consult a licensed CPA."

Be conversational, practical, and specific. When possible, give dollar estimates.`;

export async function askQuestion(req: AuthRequest, res: Response) {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    // Check if Claude API key is configured
    if (!process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY === '') {
      // Return a helpful mock response if no API key
      const mockResponses: Record<string, string> = {
        default: `Great question! As a freelancer, you have access to many valuable tax deductions. Here are some key ones:\n\n**Common Freelancer Deductions:**\n• Home office (if used exclusively for work)\n• Software subscriptions (design tools, project management, etc.)\n• Equipment (computers, monitors, keyboards)\n• Internet and phone (business percentage)\n• Professional development and courses\n• Business meals (50% deductible)\n• Travel to client meetings\n\n**Quarterly Tax Tip:** Set aside 25-30% of each payment for taxes to avoid surprises.\n\n*Note: This is general guidance. For your specific situation, consult a CPA.*`,
      };
      return res.json({ question, answer: mockResponses.default, isMock: true });
    }

    const user = db.prepare('SELECT business_type, state FROM users WHERE id = ?').get(req.userId) as any;
    const incomeTotal = (db.prepare('SELECT COALESCE(SUM(amount),0) as t FROM income_records WHERE user_id = ? AND tax_year = ?').get(req.userId, new Date().getFullYear()) as any).t;
    const expenseTotal = (db.prepare('SELECT COALESCE(SUM(deductible_amount),0) as t FROM expenses WHERE user_id = ? AND tax_year = ? AND deleted_at IS NULL').get(req.userId, new Date().getFullYear()) as any).t;

    const userContext = `\nUser context: ${user?.business_type || 'freelancer'} in ${user?.state || 'US'}, YTD income: $${incomeTotal?.toFixed(0) || '0'}, YTD deductions: $${expenseTotal?.toFixed(0) || '0'}.`;

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + userContext,
      messages: [{ role: 'user', content: question }]
    });

    const answer = response.content[0].type === 'text' ? response.content[0].text : '';
    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    db.prepare('INSERT INTO ai_conversations (user_id, question, answer, tokens_used) VALUES (?, ?, ?, ?)').run(req.userId, question, answer, tokensUsed);

    return res.json({ question, answer, tokensUsed });
  } catch (err: any) {
    if (err.message?.includes('API key')) {
      return res.json({
        question: req.body.question,
        answer: `**Tax Tip for Freelancers:** As a self-employed individual, you can deduct ordinary and necessary business expenses. Common deductions include home office, equipment, software, professional development, and business travel.\n\nSet aside 25-30% of income for quarterly estimated taxes. The due dates are April 15, June 17, September 16, and January 15.\n\n*Note: Add your Claude API key to enable personalized AI guidance.*`,
        isMock: true
      });
    }
    return res.status(500).json({ error: err.message });
  }
}

export function getConversations(req: AuthRequest, res: Response) {
  const conversations = db.prepare(
    'SELECT id, question, answer, created_at FROM ai_conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
  ).all(req.userId) as any[];
  return res.json({ conversations });
}

export function getDeductionSuggestions(req: AuthRequest, res: Response) {
  const year = new Date().getFullYear();
  const expenses = db.prepare(
    'SELECT category FROM expenses WHERE user_id = ? AND tax_year = ? AND deleted_at IS NULL'
  ).all(req.userId, year) as any[];

  const hasCategories = new Set(expenses.map((e: any) => e.category));

  const allSuggestions = [
    { category: 'home-office', suggestion: 'Home office deduction: If you work from home, you can deduct $5/sq ft (up to 300 sq ft) or actual expenses.', estimatedValue: 1500, icon: '🏠' },
    { category: 'vehicle', suggestion: 'Mileage deduction: Track business miles at $0.67/mile for 2024. Even occasional client visits add up.', estimatedValue: 800, icon: '🚗' },
    { category: 'phone', suggestion: 'Phone & internet: Deduct the business-use percentage of your monthly bill. Most freelancers qualify for 50-80%.', estimatedValue: 600, icon: '📱' },
    { category: 'education', suggestion: 'Online courses & books: Any education related to your current freelance work is fully deductible.', estimatedValue: 500, icon: '📚' },
    { category: 'insurance', suggestion: 'Health insurance premiums: Self-employed individuals can deduct 100% of health insurance premiums.', estimatedValue: 3000, icon: '🛡️' },
    { category: 'retirement', suggestion: 'SEP-IRA contribution: Contribute up to 25% of net self-employment income (max $69,000 for 2024).', estimatedValue: 5000, icon: '💰' },
    { category: 'software', suggestion: 'Software subscriptions: Track all your tools — design software, project management, cloud storage are all deductible.', estimatedValue: 1200, icon: '💻' },
    { category: 'marketing', suggestion: 'Portfolio website & hosting: Your website costs, domain registration, and hosting fees are all deductible.', estimatedValue: 400, icon: '🌐' },
  ];

  const suggestions = allSuggestions
    .filter(s => !hasCategories.has(s.category))
    .slice(0, 5);

  return res.json({ suggestions, totalPotential: suggestions.reduce((sum, s) => sum + s.estimatedValue, 0) });
}
