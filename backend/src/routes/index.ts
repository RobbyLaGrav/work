import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { register, login, getProfile, updateProfile } from '../controllers/authController';
import { createExpense, listExpenses, getExpense, updateExpense, deleteExpense, getCategories } from '../controllers/expenseController';
import { createIncome, listIncome, deleteIncome } from '../controllers/incomeController';
import { calculateAnnual, calculateQuarterly, getDueDates, getDashboardSummary } from '../controllers/taxController';
import { askQuestion, getConversations, getDeductionSuggestions } from '../controllers/aiController';

const router = Router();

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/users/profile', authMiddleware, getProfile);
router.put('/users/profile', authMiddleware, updateProfile);

// Expenses
router.get('/categories', authMiddleware, getCategories);
router.post('/expenses', authMiddleware, createExpense);
router.get('/expenses', authMiddleware, listExpenses);
router.get('/expenses/:id', authMiddleware, getExpense);
router.put('/expenses/:id', authMiddleware, updateExpense);
router.delete('/expenses/:id', authMiddleware, deleteExpense);

// Income
router.post('/income', authMiddleware, createIncome);
router.get('/income', authMiddleware, listIncome);
router.delete('/income/:id', authMiddleware, deleteIncome);

// Tax
router.get('/tax/annual', authMiddleware, calculateAnnual);
router.get('/tax/quarterly', authMiddleware, calculateQuarterly);
router.get('/tax/due-dates', authMiddleware, getDueDates);
router.get('/dashboard', authMiddleware, getDashboardSummary);

// AI
router.post('/ai/ask', authMiddleware, askQuestion);
router.get('/ai/conversations', authMiddleware, getConversations);
router.get('/ai/suggestions', authMiddleware, getDeductionSuggestions);

export default router;
