import db from '../config/database';

// 2024 federal tax brackets (single filer)
const FEDERAL_BRACKETS_2024 = [
  { max: 11600,  rate: 0.10 },
  { max: 47150,  rate: 0.12 },
  { max: 100525, rate: 0.22 },
  { max: 191950, rate: 0.24 },
  { max: 243725, rate: 0.32 },
  { max: 609350, rate: 0.35 },
  { max: Infinity, rate: 0.37 },
];

const STANDARD_DEDUCTION_2024 = 14600;
const SE_TAX_RATE = 0.153;
const SE_INCOME_FACTOR = 0.9235;
const SE_DEDUCTION_FACTOR = 0.5; // Deduct half of SE tax

function calcFederalTax(taxableIncome: number): number {
  let tax = 0;
  let prev = 0;
  for (const bracket of FEDERAL_BRACKETS_2024) {
    if (taxableIncome <= prev) break;
    const amount = Math.min(taxableIncome, bracket.max) - prev;
    tax += amount * bracket.rate;
    prev = bracket.max;
  }
  return Math.max(0, tax);
}

// Basic state tax rates by state (simplified flat-ish approach)
const STATE_TAX_RATES: Record<string, number> = {
  CA: 0.093, NY: 0.0685, TX: 0, FL: 0, WA: 0,
  IL: 0.0495, PA: 0.0307, OH: 0.04, GA: 0.055,
  NC: 0.0525, MI: 0.0425, NJ: 0.0637, VA: 0.0575,
  AZ: 0.025, MA: 0.05, TN: 0, NV: 0, CO: 0.044,
  OR: 0.099, MN: 0.0985, WI: 0.0765, DEFAULT: 0.05,
};

export function getQuarterDates(year: number) {
  return [
    { quarter: 1, start: `${year}-01-01`, end: `${year}-03-31`, dueDate: `${year}-04-15`, label: 'Q1 (Jan–Mar)' },
    { quarter: 2, start: `${year}-04-01`, end: `${year}-06-30`, dueDate: `${year}-06-17`, label: 'Q2 (Apr–Jun)' },
    { quarter: 3, start: `${year}-07-01`, end: `${year}-09-30`, dueDate: `${year}-09-16`, label: 'Q3 (Jul–Sep)' },
    { quarter: 4, start: `${year}-10-01`, end: `${year}-12-31`, dueDate: `${year + 1}-01-15`, label: 'Q4 (Oct–Dec)' },
  ];
}

export function calculateTaxForYear(userId: number, year: number) {
  const user = db.prepare('SELECT state FROM users WHERE id = ?').get(userId) as any;
  const stateRate = STATE_TAX_RATES[user?.state || 'DEFAULT'] ?? STATE_TAX_RATES.DEFAULT;

  const incomeRow = db.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total FROM income_records WHERE user_id = ? AND tax_year = ?'
  ).get(userId, year) as any;

  const deductionRow = db.prepare(
    'SELECT COALESCE(SUM(deductible_amount), 0) as total FROM expenses WHERE user_id = ? AND tax_year = ? AND is_deductible = 1 AND deleted_at IS NULL'
  ).get(userId, year) as any;

  const totalIncome = incomeRow.total || 0;
  const totalDeductions = deductionRow.total || 0;
  const netIncome = Math.max(0, totalIncome - totalDeductions);

  // SE tax
  const seIncome = netIncome * SE_INCOME_FACTOR;
  const selfEmploymentTax = seIncome * SE_TAX_RATE;
  const seDeduction = selfEmploymentTax * SE_DEDUCTION_FACTOR;

  // Federal income tax
  const agi = Math.max(0, netIncome - seDeduction);
  const taxableIncome = Math.max(0, agi - STANDARD_DEDUCTION_2024);
  const federalTax = calcFederalTax(taxableIncome);

  // State tax (simplified)
  const stateTax = taxableIncome * stateRate;

  const totalTax = federalTax + selfEmploymentTax + stateTax;
  const quarterlyPayment = totalTax / 4;

  return {
    taxYear: year,
    totalIncome,
    totalDeductions,
    netIncome,
    seDeduction,
    standardDeduction: STANDARD_DEDUCTION_2024,
    taxableIncome,
    federalTax,
    stateTax,
    selfEmploymentTax,
    totalTax,
    quarterlyPayment,
    effectiveRate: totalIncome > 0 ? (totalTax / totalIncome) : 0,
    quarterDueDates: getQuarterDates(year),
  };
}

export function calculateByQuarter(userId: number, year: number) {
  const quarters = getQuarterDates(year);
  const user = db.prepare('SELECT state FROM users WHERE id = ?').get(userId) as any;
  const stateRate = STATE_TAX_RATES[user?.state || 'DEFAULT'] ?? STATE_TAX_RATES.DEFAULT;

  return quarters.map(q => {
    const incomeRow = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM income_records WHERE user_id = ? AND tax_year = ? AND quarter = ?'
    ).get(userId, year, q.quarter) as any;

    const deductionRow = db.prepare(
      'SELECT COALESCE(SUM(deductible_amount), 0) as total FROM expenses WHERE user_id = ? AND tax_year = ? AND quarter = ? AND is_deductible = 1 AND deleted_at IS NULL'
    ).get(userId, year, q.quarter) as any;

    const income = incomeRow.total || 0;
    const deductions = deductionRow.total || 0;
    const net = Math.max(0, income - deductions);
    const seT = net * SE_INCOME_FACTOR * SE_TAX_RATE;
    const fedT = calcFederalTax(Math.max(0, net - STANDARD_DEDUCTION_2024 / 4));
    const stateT = Math.max(0, net - STANDARD_DEDUCTION_2024 / 4) * stateRate;
    const totalT = seT + fedT + stateT;

    return { ...q, income, deductions, netIncome: net, selfEmploymentTax: seT, federalTax: fedT, stateTax: stateT, totalTax: totalT };
  });
}
