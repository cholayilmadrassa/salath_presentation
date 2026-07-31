import express from 'express';
import Count from '../models/Count.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 1. Create a new count entry (multiple entries per day allowed!)
router.post('/entry', auth, async (req, res) => {
  try {
    const { value, date, note } = req.body;
    const numValue = Number(value);
    if (Number.isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({ message: 'Invalid number' });
    }
    if (numValue > 100000) {
      return res.status(400).json({ message: 'Single entry count cannot exceed 100,000 (1 Lakh)' });
    }
    const entryDate = date || todayKey();
    const newEntry = await Count.create({
      user: req.user.userId || req.user.id,
      tenantId: req.tenant ? req.tenant._id : null,
      date: entryDate,
      value: numValue,
      note: note || '',
    });
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Backwards-compatible POST route for today
router.post('/me/today', auth, async (req, res) => {
  try {
    const { value, note } = req.body;
    const numValue = Number(value);
    if (Number.isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({ message: 'Invalid value' });
    }
    if (numValue > 100000) {
      return res.status(400).json({ message: 'Single entry count cannot exceed 100,000 (1 Lakh)' });
    }
    const date = todayKey();
    const newEntry = await Count.create({
      user: req.user.userId || req.user.id,
      tenantId: req.tenant ? req.tenant._id : null,
      date,
      value: numValue,
      note: note || '',
    });
    res.json(newEntry);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 2. Get all count entries for current user in active tenant
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const filter = { user: userId };
    if (req.tenant) {
      filter.tenantId = req.tenant._id;
    }
    const items = await Count.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 3. Get entries and total for a specific date
router.get('/day', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const targetDate = req.query.date || todayKey();
    const filter = { user: userId, date: targetDate };
    if (req.tenant) {
      filter.tenantId = req.tenant._id;
    }
    const entries = await Count.find(filter).sort({ createdAt: -1 });
    const dayTotal = entries.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    res.json({ date: targetDate, dayTotal, entries });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 4. Delete a specific entry
router.delete('/entry/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const deleted = await Count.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!deleted) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Entry deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 5. Public: Leaderboard for today
router.get('/leaderboard/today', async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const date = todayKey();
    const filter = { date };
    if (req.tenant) {
      filter.tenantId = req.tenant._id;
    }

    const countsToday = await Count.find(filter).populate('user', 'name');

    const userTotalsMap = {};
    countsToday.forEach((item) => {
      if (item.user) {
        const uid = item.user._id ? item.user._id.toString() : String(item.user);
        const uname = item.user.name || 'അംഗം';
        if (!userTotalsMap[uid]) {
          userTotalsMap[uid] = { userId: uid, name: uname, value: 0 };
        }
        userTotalsMap[uid].value += Number(item.value) || 0;
      }
    });

    let rows = Object.values(userTotalsMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

    if (!rows || rows.length === 0) {
      const allFilter = {};
      if (req.tenant) allFilter.tenantId = req.tenant._id;
      const allCounts = await Count.find(allFilter).populate('user', 'name');
      const allMap = {};
      allCounts.forEach((item) => {
        if (item.user) {
          const uid = item.user._id ? item.user._id.toString() : String(item.user);
          const uname = item.user.name || 'അംഗം';
          if (!allMap[uid]) {
            allMap[uid] = { userId: uid, name: uname, value: 0 };
          }
          allMap[uid].value += Number(item.value) || 0;
        }
      });
      rows = Object.values(allMap)
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
    }

    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 6. Public: Overall Leaderboard across all time
router.get('/leaderboard/all', async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const filter = {};
    if (req.tenant) filter.tenantId = req.tenant._id;

    const allCounts = await Count.find(filter).populate('user', 'name');
    const allMap = {};
    allCounts.forEach((item) => {
      if (item.user) {
        const uid = item.user._id ? item.user._id.toString() : String(item.user);
        const uname = item.user.name || 'അംഗം';
        if (!allMap[uid]) {
          allMap[uid] = { userId: uid, name: uname, value: 0 };
        }
        allMap[uid].value += Number(item.value) || 0;
      }
    });

    const rows = Object.values(allMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
