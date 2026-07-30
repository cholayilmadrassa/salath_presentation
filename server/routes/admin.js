import express from 'express';
import User from '../models/User.js';
import Count from '../models/Count.js';
import Registration from '../models/Registration.js';

const router = express.Router();

// List registrations for active tenant (or all users if platform level)
router.get('/users', async (req, res) => {
  try {
    if (req.tenant) {
      const registrations = await Registration.find({ tenantId: req.tenant._id })
        .populate('userId', 'name phone place mahallu createdAt')
        .sort({ createdAt: -1 });

      const users = registrations.map((r) => r.userId).filter(Boolean);
      return res.json(users);
    }

    const users = await User.find({}, { name: 1, phone: 1, place: 1, mahallu: 1, createdAt: 1 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get counts for specific user
router.get('/users/:userId/counts', async (req, res) => {
  try {
    const filter = { user: req.params.userId };
    if (req.tenant) {
      filter.tenantId = req.tenant._id;
    }

    const items = await Count.find(filter).sort({ date: -1 });
    const totalCount = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    res.json({
      totalCount,
      items,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Dashboard Analytics (tenant-scoped if req.tenant is resolved)
router.get('/dashboard', async (req, res) => {
  try {
    const filter = {};
    if (req.tenant) {
      filter.tenantId = req.tenant._id;
    }

    const allCounts = await Count.find(filter).populate('user', 'name phone place');

    let totalAmount = 0;
    const userTotalsMap = {};
    const graphMap = {};

    allCounts.forEach((item) => {
      const val = Number(item.value) || 0;
      totalAmount += val;

      if (item.date) {
        graphMap[item.date] = (graphMap[item.date] || 0) + val;
      }

      if (item.user) {
        const uid = item.user._id ? item.user._id.toString() : String(item.user);
        const uname = item.user.name || 'അംഗം';
        const uphone = item.user.phone || '';
        const uplace = item.user.place || '';

        if (!userTotalsMap[uid]) {
          userTotalsMap[uid] = { userId: uid, name: uname, phone: uphone, place: uplace, total: 0 };
        }
        userTotalsMap[uid].total += val;
      }
    });

    const sortedUsers = Object.values(userTotalsMap).sort((a, b) => b.total - a.total);
    const topUsers = sortedUsers.slice(0, 4);

    const graphData = Object.keys(graphMap)
      .sort()
      .map((dateKey) => ({ _id: dateKey, total: graphMap[dateKey] }));

    res.json({
      totalAmount,
      topUsers,
      graphData,
      allUsers: sortedUsers,
    });
  } catch (err) {
    console.error('Admin Dashboard fetch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
