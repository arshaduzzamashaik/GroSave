// prisma/seed.js
const { PrismaClient, SlotId } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Pickup Location (with legacy timeSlots JSON for backwards-compat UI)
  const hub = await prisma.pickupLocation.upsert({
    where: { id: 'seed-hub-mlswm' },
    update: {},
    create: {
      id: 'seed-hub-mlswm',
      name: 'Malleswaram Kirana Hub',
      address: 'Shop 12, Malleswaram Main Road',
      city: 'Bangalore',
      pincode: '560003',
      latitude: 13.0038,
      longitude: 77.5712,
      timeSlots: [
        { id: 'morning', label: 'Morning', time: '8 AM - 12 PM', available: 15 },
        { id: 'afternoon', label: 'Afternoon', time: '12 PM - 4 PM', available: 15 },
        { id: 'evening', label: 'Evening', time: '4 PM - 7 PM', available: 15 },
      ],
    },
  });

  // --- Pickup Slots for today (capacity managed)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mkSlot = (slotEnum, label, capacity) =>
    prisma.pickupSlot.upsert({
      where: {
        pickupLocationId_date_slot: {
          pickupLocationId: hub.id,
          date: today,
          slot: slotEnum,
        },
      },
      update: { capacity },
      create: {
        pickupLocationId: hub.id,
        date: today,
        slot: slotEnum,
        label,
        capacity,
        reservedCount: 0,
      },
    });

  await Promise.all([
    mkSlot(SlotId.morning, 'Morning (8 AM - 12 PM)', 15),
    mkSlot(SlotId.afternoon, 'Afternoon (12 PM - 4 PM)', 15),
    mkSlot(SlotId.evening, 'Evening (4 PM - 7 PM)', 15),
  ]);

  // --- Product
  await prisma.product.create({
    data: {
      name: 'Organic Whole Milk',
      brand: 'Happy Farms',
      category: 'Dairy',
      description: 'Fresh organic whole milk from grass-fed cows.',
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800',
      images: [
        'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800',
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800',
      ],
      currentPrice: 50,
      originalPrice: 200,
      discount: 75,
      expiryStatus: 'warning',
      expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      unitsAvailable: 23,
      nutritionInfo: { calories: 150, protein: '8g', fat: '8g' },
      storageInfo: [
        'Keep refrigerated at 4°C or below',
        'Once opened, consume within 3 days',
      ],
      safetyInfo: [
        'Check seal before opening',
        'Not suitable for individuals with dairy allergies',
      ],
      dynamicPricingEnabled: true,
      dropToPriceAtHoursBeforeExpiry: 24,
      freeAtHoursBeforeExpiry: 6,
    },
  });

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
