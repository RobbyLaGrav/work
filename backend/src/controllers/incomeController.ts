import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

function getQuarter(dateStr: string): number {
  const month = new Date(dateStr).getMonth() + 1;
  return Math.ceil(month / 3);
}

export function createIncome(req: AuthRequest, res: Response) {
  try {
    const { date, amount, currency = 'USD', clientName, projectName, incomeType = 'project', notes } = req.body;
    if (!date || !amount) return res.status(400).json({ error: 'date and amount are required' });

    const taxYear = new Date(date).getFullYear();
    const quarter = getQuarter(date);

    const result = db.prepare(`
      INSERT INTO income_records (user_id, date, amount, currency, client_name, project_name, income_type, tax_year, quarter, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.userId, date, amount, currency, clientName || null, projectName || null, incomeType, taxYear, quarter, notes || null);

    const record = db.prepare('SELECT * FROM income_records WHERE id = ?').get(result.lastInsertRowid) as any;
    return res.status(201).json(formatIncome(record));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export function listIncome(req: AuthRequest, res: Response) {
  try {
    const { taxYear = new Date().getFullYear(), limit = 100, offset = 0 } = req.query;
    const records = db.prepare(
      'SELECT * FROM income_records WHERE user_id = ? AND tax_year = ? ORDER BY date DESC LIMIT ? OFFSET ?'
    ).all(req.userId, taxYear, Number(limit), Number(offset)) as any[];
    const total = (db.prepare('SELECT COUNT(*) as count FROM income_records WHERE user_id = ? AND tax_year = ?').get(req.userId, taxYear) as any).count;
    return res.json({ data: records.map(formatIncome), pagination: { limit: Number(limit), offset: Number(offset), total } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export function deleteIncome(req: AuthRequest, res: Response) {
  const record = db.prepare('SELECT id FROM income_records WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!record) return res.status(404).json({ error: 'Income record not found' });
  db.prepare('DELETE FROM income_records WHERE id = ?').run(req.params.id);
  return res.status(204).send();
}

function formatIncome(r: any) {
  return {
    id: r.id,
    date: r.date,
    amount: r.amount,
    currency: r.currency,
    clientName: r.client_name,
    projectName: r.project_name,
    incomeType: r.income_type,
    taxYear: r.tax_year,
    quarter: r.quarter,
    notes: r.notes,
    createdAt: r.created_at
  };
}
