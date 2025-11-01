// src/controllers/pickupController.js
const prisma = require('../config/database');

/**
 * GET /pickup-locations
 * Returns active pickup locations with:
 *  - legacy `timeSlots` array (if present in JSON column; defaults to [])
 *  - normalized `slots` (capacity-managed) list with selected fields
 */
async function getPickupLocations(req, res) {
  try {
    const locations = await prisma.pickupLocation.findMany({
      where: { isActive: true },
      include: { slots: true },
    });

    const formatted = locations.map((loc) => ({
      // keep all original location fields
      ...loc,
      // keep legacy array for UI components that still read this
      timeSlots: Array.isArray(loc.timeSlots) ? loc.timeSlots : (loc.timeSlots || []),
      // normalize capacity-managed slots
      slots: (loc.slots || []).map((s) => ({
        id: s.id,
        date: s.date,
        slot: s.slot, // 'morning' | 'afternoon' | 'evening'
        label: s.label,
        capacity: s.capacity,
        reservedCount: s.reservedCount,
        pickupLocationId: s.pickupLocationId,
      })),
    }));

    return res.json({ locations: formatted });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch locations' });
  }
}

function atMidnight(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * GET /pickup-slots?pickupLocationId=...&date=YYYY-MM-DD
 *    or /pickup-slots?locationId=...&date=YYYY-MM-DD
 * Supports both `pickupLocationId` (legacy) and `locationId` (new) query params.
 * Returns normalized slots for the given location + day.
 */
async function getPickupSlots(req, res) {
  try {
    const locationId = req.query.pickupLocationId || req.query.locationId;
    const { date } = req.query;

    if (!locationId || !date) {
      return res.status(400).json({ error: 'locationId/pickupLocationId and date are required' });
    }

    const day = atMidnight(date);

    const slots = await prisma.pickupSlot.findMany({
      where: { pickupLocationId: locationId, date: day },
      orderBy: { slot: 'asc' },
    });

    return res.json({
      slots: (slots || []).map((s) => ({
        id: s.id,
        date: s.date,
        slot: s.slot,
        label: s.label,
        capacity: s.capacity,
        reservedCount: s.reservedCount,
        pickupLocationId: s.pickupLocationId,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch slots' });
  }
}

module.exports = { getPickupLocations, getPickupSlots };
