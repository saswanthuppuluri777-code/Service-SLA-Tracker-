import express from 'express';
import { SLAPolicy } from '../models/SLAPolicy.js';

const router = express.Router();

/**
 * GET /api/sla-policies
 * List all configured SLA rules
 */
router.get('/', async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = {};
    if (activeOnly === 'true') {
      filter.isActive = true;
    }

    const policies = await SLAPolicy.find(filter).sort({ priority: 1, category: 1 });
    res.json({
      success: true,
      count: policies.length,
      data: policies,
    });
  } catch (err) {
    console.error('Error fetching SLA policies:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/sla-policies
 * Create a new SLA rule (priority, category, response/resolution targets)
 */
router.post('/', async (req, res) => {
  try {
    const { name, priority, category, firstResponseTimeMinutes, resolutionTimeMinutes, isActive = true } = req.body;

    if (!name || !priority || !category || !firstResponseTimeMinutes || !resolutionTimeMinutes) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, priority, category, firstResponseTimeMinutes, and resolutionTimeMinutes',
      });
    }

    const newPolicy = new SLAPolicy({
      name: name.trim(),
      priority,
      category,
      firstResponseTimeMinutes: Number(firstResponseTimeMinutes),
      resolutionTimeMinutes: Number(resolutionTimeMinutes),
      isActive: Boolean(isActive),
    });

    await newPolicy.save();

    res.status(201).json({
      success: true,
      message: 'SLA Policy created successfully',
      data: newPolicy,
    });
  } catch (err) {
    console.error('Error creating SLA policy:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/sla-policies/:id
 * Update an existing SLA policy
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, priority, category, firstResponseTimeMinutes, resolutionTimeMinutes, isActive } = req.body;

    const policy = await SLAPolicy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ success: false, error: 'SLA Policy not found' });
    }

    if (name !== undefined) policy.name = name.trim();
    if (priority !== undefined) policy.priority = priority;
    if (category !== undefined) policy.category = category;
    if (firstResponseTimeMinutes !== undefined) policy.firstResponseTimeMinutes = Number(firstResponseTimeMinutes);
    if (resolutionTimeMinutes !== undefined) policy.resolutionTimeMinutes = Number(resolutionTimeMinutes);
    if (isActive !== undefined) policy.isActive = Boolean(isActive);

    await policy.save();

    res.json({
      success: true,
      message: 'SLA Policy updated successfully',
      data: policy,
    });
  } catch (err) {
    console.error('Error updating SLA policy:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/sla-policies/:id
 * Delete or soft-deactivate an SLA policy
 */
router.delete('/:id', async (req, res) => {
  try {
    const policy = await SLAPolicy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ success: false, error: 'SLA Policy not found' });
    }

    await SLAPolicy.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'SLA Policy deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting SLA policy:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
