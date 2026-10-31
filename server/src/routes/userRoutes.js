import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

/**
 * GET /api/users
 * Returns list of agents/users, optionally filtered by role or team
 */
router.get('/', async (req, res) => {
  try {
    const { role, team } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (team) filter.team = team;

    const users = await User.find(filter).sort({ name: 1 });
    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/users
 * Create a new user/agent
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, role = 'agent', team } = req.body;

    if (!name || !email || !team) {
      return res.status(400).json({ success: false, error: 'Name, email, and team are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    const newUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      team: team.trim(),
    });

    await newUser.save();
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
