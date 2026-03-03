import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { calculateTaxForYear, calculateByQuarter, getQuarterDates } from '../services/taxCalculationService';
import db from '../config/database';

export function calculateAnnual(req: AuthRequest, res: Response) {
  try {
    const year = Number(req.query.year || req.body?.year || new Date().getFullYear());
    const result = calculateTaxForYear(req.userId!, year);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export function calculateQuarterly(req: AuthRequest, res: Response) {
  try {
    const year = Number(req.query.year || req.body?.year || new Date().getFullYear());
    const result = calculateByQuarter(req.userId!, year);
    return res.json({ year, quarters: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export function getDueDates(req: AuthRequest, res: Response) {
  const year = Number(req.query.year || new Date().getFullYear());
  return res.json({ year, dueDates: getQuarterDates(year) });
}

export function getDashboardSummary(req: AuthRequest, res: Response) {
  try {
    const year = new Date().getFullYear();
    const annualCalc = calculateTaxForYear(req.userId!, year);
    const quarterlyCalc = calculateByQuarter(req.userId!, year);

    const expenseCount = (db.prepare('SELECT COUNT(*) as c FROM expenses WHERE user_id = ? AND tax_year = ? AND deleted_at IS NULL').get(req.userId, year) as any).c;
    const incomeCount = (db.prepare('SELECT COUNT(*) as c FROM income_records WHERE user_id = ? AND tax_year = ?').get(req.userId, year) as any).c;

    // Top categories
    const topCategories = db.prepare(`
      SELECT category, SUM(deductible_amount) as total, COUNT(*) as count
      FROM expenses WHERE user_id = ? AND tax_year = ? AND deleted_at IS NULL
      GROUP BY category ORDER BY total DESC LIMIT 5
    `).all(req.userId, year) as any[];

    // Monthly breakdown for chart
    const monthly = [];
    for (let m = 1; m <= 12; m++) {
      const monthStr = String(m).padStart(2, '0');
      const inc = (db.prepare(`SELECT COALESCE(SUM(amount),0) as t FROM income_records WHERE user_id = ? AND strftime('%m', date) = ? AND tax_year = ?`).get(req.userId, monthStr, year) as any).t;
      const exp = (db.prepare(`SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE user_id = ? AND strftime('%m', date) = ? AND tax_year = ? AND deleted_at IS NULL`).get(req.userId, monthStr, year) as any).t;
      monthly.push({ month: new Date(year, m - 1).toLocaleString('default', { month: 'short' }), income: inc, expenses: exp, profit: inc - exp });
    }

    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
    const nextDue = getQuarterDates(year).find(q => q.quarter >= currentQuarter) || getQuarterDates(year + 1)[0];
    const daysUntilDue = Math.ceil((new Date(nextDue.dueDate).getTime() - Date.now()) / 86400000);

    return res.json({
      year,
      metrics: {
        totalIncome: annualCalc.totalIncome,
        totalExpenses: annualCalc.totalDeductions,
        netIncome: annualCalc.netIncome,
        estimatedAnnualTax: annualCalc.totalTax,
        estimatedQuarterlyTax: annualCalc.quarterlyPayment,
        effectiveRate: annualCalc.effectiveRate,
        expenseCount,
        incomeCount
      },
      nextDue: { ...nextDue, daysUntilDue },
      topCategories: topCategories.map(c => ({
        category: c.category,
        amount: c.total,
        count: c.count,
        percentage: annualCalc.totalDeductions > 0 ? Math.round((c.total / annualCalc.totalDeductions) * 100) : 0
      })),
      monthly,
      quarters: quarterlyCalc
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
