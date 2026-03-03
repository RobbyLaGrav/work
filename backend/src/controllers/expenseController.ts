import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

function getQuarter(dateStr: string): number {
  const month = new Date(dateStr).getMonth() + 1;
  return Math.ceil(month / 3);
}

export function createExpense(req: AuthRequest, res: Response) {
  try {
    const { date, amount, currency = 'USD', category, description, vendor, notes, isDeductible = true, deductionPercentage = 100 } = req.body;

    if (!date || !amount || !category || !description) {
      return res.status(400).json({ error: 'date, amount, category and description are required' });
    }

    const taxYear = new Date(date).getFullYear();
    const quarter = getQuarter(date);
    const deductibleAmount = isDeductible ? (amount * deductionPercentage) / 100 : 0;

    const result = db.prepare(`
      INSERT INTO expenses (user_id, date, amount, currency, category, description, vendor, notes, is_deductible, deduction_percentage, deductible_amount, tax_year, quarter)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.userId, date, amount, currency, category, description, vendor || null, notes || null, isDeductible ? 1 : 0, deductionPercentage, deductibleAmount, taxYear, quarter);

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid) as any;
    return res.status(201).json(formatExpense(expense));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export function listExpenses(req: AuthRequest, res: Response) {
  try {
    const { taxYear = new Date().getFullYear(), quarter, category, limit = 100, offset = 0 } = req.query;

    let query = `SELECT * FROM expenses WHERE user_id = ? AND tax_year = ? AND deleted_at IS NULL`;
    const params: any[] = [req.userId, taxYear];

    if (quarter) { query += ` AND quarter = ?`; params.push(quarter); }
    if (category) { query += ` AND category = ?`; params.push(category); }

    query += ` ORDER BY date DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const expenses = db.prepare(query).all(...params) as any[];
    const total = (db.prepare(`SELECT COUNT(*) as count FROM expenses WHERE user_id = ? AND tax_year = ? AND deleted_at IS NULL`).get(req.userId, taxYear) as any).count;

    return res.json({ data: expenses.map(formatExpense), pagination: { limit: Number(limit), offset: Number(offset), total } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export function getExpense(req: AuthRequest, res: Response) {
  const expense = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ? AND deleted_at IS NULL').get(req.params.id, req.userId) as any;
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  return res.json(formatExpense(expense));
}

export function updateExpense(req: AuthRequest, res: Response) {
  try {
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const { date, amount, category, description, vendor, notes, isDeductible, deductionPercentage } = req.body;

    const newDate = date || expense.date;
    const newAmount = amount !== undefined ? amount : expense.amount;
    const newIsDeductible = isDeductible !== undefined ? isDeductible : !!expense.is_deductible;
    const newPct = deductionPercentage !== undefined ? deductionPercentage : expense.deduction_percentage;
    const newDeductible = newIsDeductible ? (newAmount * newPct) / 100 : 0;

    db.prepare(`
      UPDATE expenses SET
        date = ?, amount = ?, category = COALESCE(?, category),
        description = COALESCE(?, description), vendor = COALESCE(?, vendor),
        notes = COALESCE(?, notes), is_deductible = ?, deduction_percentage = ?,
        deductible_amount = ?, tax_year = ?, quarter = ?,
        updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(newDate, newAmount, category, description, vendor, notes, newIsDeductible ? 1 : 0, newPct, newDeductible, new Date(newDate).getFullYear(), getQuarter(newDate), req.params.id, req.userId);

    const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id) as any;
    return res.json(formatExpense(updated));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export function deleteExpense(req: AuthRequest, res: Response) {
  const expense = db.prepare('SELECT id FROM expenses WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  db.prepare("UPDATE expenses SET deleted_at = datetime('now') WHERE id = ?").run(req.params.id);
  return res.status(204).send();
}

export function getCategories(_req: AuthRequest, res: Response) {
  const categories = [
    { id: 'software', name: 'Software & Subscriptions', icon: '💻', color: '#3B82F6', isDeductible: true },
    { id: 'equipment', name: 'Equipment & Hardware', icon: '🖥️', color: '#8B5CF6', isDeductible: true },
    { id: 'meals', name: 'Meals & Entertainment', icon: '🍽️', color: '#F59E0B', isDeductible: true, pct: 50 },
    { id: 'travel', name: 'Travel', icon: '✈️', color: '#EC4899', isDeductible: true },
    { id: 'home-office', name: 'Home Office', icon: '🏠', color: '#10B981', isDeductible: true },
    { id: 'phone', name: 'Phone & Internet', icon: '📱', color: '#06B6D4', isDeductible: true },
    { id: 'education', name: 'Education & Training', icon: '📚', color: '#F97316', isDeductible: true },
    { id: 'marketing', name: 'Marketing & Advertising', icon: '📣', color: '#EF4444', isDeductible: true },
    { id: 'professional-services', name: 'Professional Services', icon: '⚖️', color: '#6B7280', isDeductible: true },
    { id: 'insurance', name: 'Business Insurance', icon: '🛡️', color: '#14B8A6', isDeductible: true },
    { id: 'vehicle', name: 'Vehicle & Mileage', icon: '🚗', color: '#A855F7', isDeductible: true },
    { id: 'other', name: 'Other Business Expenses', icon: '📦', color: '#64748B', isDeductible: true },
  ];
  return res.json({ categories });
}

function formatExpense(e: any) {
  return {
    id: e.id,
    date: e.date,
    amount: e.amount,
    currency: e.currency,
    category: e.category,
    description: e.description,
    vendor: e.vendor,
    notes: e.notes,
    isDeductible: !!e.is_deductible,
    deductionPercentage: e.deduction_percentage,
    deductibleAmount: e.deductible_amount,
    taxYear: e.tax_year,
    quarter: e.quarter,
    createdAt: e.created_at
  };
}
