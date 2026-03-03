import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database';

function generateToken(userId: number, email: string) {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, firstName, lastName, businessType, businessName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, business_type, business_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(email, passwordHash, firstName || '', lastName || '', businessType || 'freelancer', businessName || '');

    const userId = result.lastInsertRowid as number;
    const token = generateToken(userId, email);

    // Create free subscription record
    db.prepare(`
      INSERT INTO subscriptions (user_id, plan, status, current_period_start, current_period_end)
      VALUES (?, 'free', 'active', datetime('now'), datetime('now', '+100 years'))
    `).run(userId);

    return res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        businessType: businessType || 'freelancer',
        subscriptionTier: 'free'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    db.prepare("UPDATE users SET updated_at = datetime('now') WHERE id = ?").run(user.id);

    const token = generateToken(user.id, user.email);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        businessType: user.business_type,
        businessName: user.business_name,
        subscriptionTier: user.subscription_tier
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export function getProfile(req: any, res: Response) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.json({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    businessType: user.business_type,
    businessName: user.business_name,
    country: user.country,
    state: user.state,
    currency: user.currency,
    subscriptionTier: user.subscription_tier
  });
}

export async function updateProfile(req: any, res: Response) {
  const { firstName, lastName, businessType, businessName, country, state } = req.body;

  db.prepare(`
    UPDATE users SET
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      business_type = COALESCE(?, business_type),
      business_name = COALESCE(?, business_name),
      country = COALESCE(?, country),
      state = COALESCE(?, state),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(firstName, lastName, businessType, businessName, country, state, req.userId);

  return res.json({ message: 'Profile updated' });
}
