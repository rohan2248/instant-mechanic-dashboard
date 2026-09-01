import 'dotenv/config';
import { fakerEN_IN as faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/db';

// Deterministic: the same dataset every run. This is what makes a full
// `db:reset && db:seed` a credible disaster-recovery story rather than a
// "hope the numbers look similar" one.
faker.seed(42);

type BookingStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'ON_THE_WAY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

// India has a fixed +05:30 offset and no DST, so a constant shift is exact.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** UTC instant for a wall-clock time in Asia/Kolkata. */
function istToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(Date.UTC(year, month, day, hour, minute) - IST_OFFSET_MS);
}

/** The IST calendar date an instant falls on, as UTC midnight (for `@db.Date`). */
function istCalendarDate(instant: Date): Date {
  const shifted = new Date(instant.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

/** Today's IST calendar date parts, used as the anchor for every offset below. */
function istToday(): { year: number; month: number; day: number } {
  const shifted = new Date(Date.now() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

const CATALOGUE: Array<{
  category: string;
  slug: string;
  services: Array<{ name: string; basePricePaise: number; durationMins: number }>;
}> = [
  {
    category: 'Periodic Service',
    slug: 'periodic-service',
    services: [
      { name: 'Basic Service', basePricePaise: 249900, durationMins: 90 },
      { name: 'Comprehensive Service', basePricePaise: 549900, durationMins: 180 },
      { name: 'Premium Service', basePricePaise: 899900, durationMins: 240 },
    ],
  },
  {
    category: 'Brakes',
    slug: 'brakes',
    services: [
      { name: 'Brake Pad Replacement', basePricePaise: 349900, durationMins: 120 },
      { name: 'Brake Disc Skimming', basePricePaise: 249900, durationMins: 90 },
      { name: 'Brake Fluid Change', basePricePaise: 129900, durationMins: 45 },
    ],
  },
  {
    category: 'Battery & Electricals',
    slug: 'battery-electricals',
    services: [
      { name: 'Battery Replacement', basePricePaise: 499900, durationMins: 45 },
      { name: 'Battery Jumpstart', basePricePaise: 49900, durationMins: 30 },
      { name: 'Alternator Check', basePricePaise: 179900, durationMins: 60 },
    ],
  },
  {
    category: 'AC Service',
    slug: 'ac-service',
    services: [
      { name: 'AC Gas Refill', basePricePaise: 289900, durationMins: 90 },
      { name: 'AC Filter Replacement', basePricePaise: 149900, durationMins: 45 },
      { name: 'AC Compressor Repair', basePricePaise: 749900, durationMins: 240 },
    ],
  },
  {
    category: 'Tyres & Wheels',
    slug: 'tyres-wheels',
    services: [
      { name: 'Wheel Alignment', basePricePaise: 129900, durationMins: 60 },
      { name: 'Wheel Balancing', basePricePaise: 99900, durationMins: 45 },
      { name: 'Tyre Replacement', basePricePaise: 599900, durationMins: 90 },
    ],
  },
  {
    category: 'Denting & Painting',
    slug: 'denting-painting',
    services: [
      { name: 'Single Panel Dent Removal', basePricePaise: 349900, durationMins: 240 },
      { name: 'Full Body Paint', basePricePaise: 2499900, durationMins: 480 },
      { name: 'Scratch Removal', basePricePaise: 199900, durationMins: 120 },
    ],
  },
  {
    category: 'Diagnostics',
    slug: 'diagnostics',
    services: [
      { name: 'Engine Diagnostics', basePricePaise: 99900, durationMins: 60 },
      { name: 'Suspension Check', basePricePaise: 149900, durationMins: 75 },
      { name: 'Pre-Purchase Inspection', basePricePaise: 249900, durationMins: 120 },
    ],
  },
  {
    category: 'Roadside Assistance',
    slug: 'roadside-assistance',
    services: [
      { name: 'Flat Tyre Assistance', basePricePaise: 79900, durationMins: 45 },
      { name: 'Towing Service', basePricePaise: 299900, durationMins: 90 },
      { name: 'Fuel Delivery', basePricePaise: 59900, durationMins: 30 },
      { name: 'Lockout Assistance', basePricePaise: 99900, durationMins: 45 },
    ],
  },
];

const VEHICLE_MODELS: Array<{ make: string; model: string }> = [
  { make: 'Maruti Suzuki', model: 'Swift' },
  { make: 'Maruti Suzuki', model: 'Baleno' },
  { make: 'Maruti Suzuki', model: 'Dzire' },
  { make: 'Maruti Suzuki', model: 'Brezza' },
  { make: 'Maruti Suzuki', model: 'Wagon R' },
  { make: 'Hyundai', model: 'i20' },
  { make: 'Hyundai', model: 'Creta' },
  { make: 'Hyundai', model: 'Venue' },
  { make: 'Hyundai', model: 'Verna' },
  { make: 'Tata', model: 'Nexon' },
  { make: 'Tata', model: 'Punch' },
  { make: 'Tata', model: 'Harrier' },
  { make: 'Tata', model: 'Altroz' },
  { make: 'Mahindra', model: 'XUV700' },
  { make: 'Mahindra', model: 'Scorpio N' },
  { make: 'Mahindra', model: 'Thar' },
  { make: 'Honda', model: 'City' },
  { make: 'Honda', model: 'Amaze' },
  { make: 'Toyota', model: 'Innova Crysta' },
  { make: 'Toyota', model: 'Fortuner' },
  { make: 'Toyota', model: 'Glanza' },
  { make: 'Kia', model: 'Seltos' },
  { make: 'Kia', model: 'Sonet' },
  { make: 'Kia', model: 'Carens' },
  { make: 'MG', model: 'Hector' },
];

const CITIES = [
  'Mumbai',
  'Pune',
  'Bengaluru',
  'Hyderabad',
  'New Delhi',
  'Chennai',
  'Ahmedabad',
  'Kolkata',
  'Jaipur',
  'Nagpur',
];

const STATE_CODES = ['MH', 'KA', 'TN', 'DL', 'GJ', 'WB', 'RJ', 'TS', 'UP', 'HR'];

const CUSTOMER_COUNT = 60;
const MECHANIC_COUNT = 24;
const PAST_BOOKINGS = 526;
const TODAY_BOOKINGS = 14;
const UPCOMING_BOOKINGS = 60;

/** A booking planned in memory before it is written, so events can be built to match. */
interface PlannedBooking {
  reference: string;
  customerId: number;
  vehicleId: number;
  serviceId: number;
  mechanicId: number | null;
  status: BookingStatus;
  amountPaise: number;
  scheduledAt: Date;
  scheduledOn: Date;
  completedAt: Date | null;
  createdAt: Date;
  durationMins: number;
}

async function main(): Promise<void> {
  console.log('Resetting tables...');
  // CASCADE handles FK order; RESTART IDENTITY keeps ids stable across runs.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "BookingEvent", "Booking", "Vehicle", "Customer", "Mechanic", "Service", "ServiceCategory", "User" RESTART IDENTITY CASCADE',
  );

  // ---------- categories & services ----------
  console.log('Seeding service catalogue...');
  await prisma.serviceCategory.createMany({
    data: CATALOGUE.map((entry) => ({ name: entry.category, slug: entry.slug })),
  });
  const categories = await prisma.serviceCategory.findMany({ select: { id: true, slug: true } });
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  await prisma.service.createMany({
    data: CATALOGUE.flatMap((entry) =>
      entry.services.map((service) => ({
        name: service.name,
        categoryId: categoryIdBySlug.get(entry.slug)!,
        basePricePaise: service.basePricePaise,
        durationMins: service.durationMins,
      })),
    ),
  });
  const services = await prisma.service.findMany({
    select: { id: true, basePricePaise: true, durationMins: true },
  });

  // ---------- customers ----------
  console.log(`Seeding ${CUSTOMER_COUNT} customers...`);
  const anchor = istToday();
  await prisma.customer.createMany({
    data: Array.from({ length: CUSTOMER_COUNT }, (_, i) => {
      const name = faker.person.fullName();
      // Spread signups across ~6 months but weight them toward recent weeks, so
      // the "new customers" tile is never empty no matter what day it is demoed
      // — including the 1st of a month, when a calendar-month window is widest.
      const daysAgo = faker.helpers.weightedArrayElement([
        { weight: 25, value: faker.number.int({ min: 0, max: 13 }) },
        { weight: 30, value: faker.number.int({ min: 14, max: 60 }) },
        { weight: 45, value: faker.number.int({ min: 61, max: 180 }) },
      ]);
      return {
        name,
        email: `${faker.helpers.slugify(name).toLowerCase()}.${i}@example.com`,
        phone: `+91${9000000000 + i}`,
        city: faker.helpers.arrayElement(CITIES),
        createdAt: istToUtc(anchor.year, anchor.month, anchor.day - daysAgo, 10, 0),
      };
    }),
  });
  const customers = await prisma.customer.findMany({ select: { id: true } });

  // ---------- vehicles ----------
  console.log('Seeding vehicles...');
  const vehicleRows: Array<{
    customerId: number;
    make: string;
    model: string;
    year: number;
    registration: string;
    fuelType: 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID';
  }> = [];
  let registrationSeq = 0;
  for (const customer of customers) {
    // Roughly 40% of customers own a second vehicle.
    const count = faker.helpers.weightedArrayElement([
      { weight: 60, value: 1 },
      { weight: 40, value: 2 },
    ]);
    for (let v = 0; v < count; v += 1) {
      const vehicle = faker.helpers.arrayElement(VEHICLE_MODELS);
      const state = faker.helpers.arrayElement(STATE_CODES);
      const series = faker.string.alpha({ length: 2, casing: 'upper' });
      registrationSeq += 1;
      vehicleRows.push({
        customerId: customer.id,
        make: vehicle.make,
        model: vehicle.model,
        year: faker.number.int({ min: 2014, max: 2025 }),
        registration: `${state}${faker.number.int({ min: 10, max: 49 })}${series}${String(
          1000 + registrationSeq,
        ).slice(-4)}`,
        fuelType: faker.helpers.weightedArrayElement([
          { weight: 55, value: 'PETROL' as const },
          { weight: 30, value: 'DIESEL' as const },
          { weight: 10, value: 'CNG' as const },
          { weight: 3, value: 'ELECTRIC' as const },
          { weight: 2, value: 'HYBRID' as const },
        ]),
      });
    }
  }
  await prisma.vehicle.createMany({ data: vehicleRows });
  const vehicles = await prisma.vehicle.findMany({ select: { id: true, customerId: true } });
  const vehiclesByCustomer = new Map<number, number[]>();
  for (const vehicle of vehicles) {
    const list = vehiclesByCustomer.get(vehicle.customerId) ?? [];
    list.push(vehicle.id);
    vehiclesByCustomer.set(vehicle.customerId, list);
  }

  // ---------- mechanics ----------
  console.log(`Seeding ${MECHANIC_COUNT} mechanics...`);
  await prisma.mechanic.createMany({
    data: Array.from({ length: MECHANIC_COUNT }, (_, i) => {
      const name = faker.person.fullName();
      return {
        name,
        email: `${faker.helpers.slugify(name).toLowerCase()}.${i}@instantmechanic.in`,
        phone: `+91${9800000000 + i}`,
        status: faker.helpers.weightedArrayElement([
          { weight: 55, value: 'AVAILABLE' as const },
          { weight: 30, value: 'ON_JOB' as const },
          { weight: 15, value: 'OFF_DUTY' as const },
        ]),
        hiredAt: istToUtc(
          anchor.year,
          anchor.month,
          anchor.day - faker.number.int({ min: 30, max: 900 }),
          9,
          0,
        ),
      };
    }),
  });
  const mechanics = await prisma.mechanic.findMany({ select: { id: true } });

  // ---------- bookings ----------
  console.log(`Planning ${PAST_BOOKINGS + TODAY_BOOKINGS + UPCOMING_BOOKINGS} bookings...`);
  const planned: PlannedBooking[] = [];
  let referenceSeq = 0;

  function planBooking(dayOffset: number, status: BookingStatus): PlannedBooking {
    const customer = faker.helpers.arrayElement(customers);
    const customerVehicles = vehiclesByCustomer.get(customer.id)!;
    const vehicleId = faker.helpers.arrayElement(customerVehicles);
    const service = faker.helpers.arrayElement(services);

    // Service slots run 09:00–18:45 IST, on the quarter hour.
    const hour = faker.number.int({ min: 9, max: 18 });
    const minute = faker.helpers.arrayElement([0, 15, 30, 45]);
    const scheduledAt = istToUtc(anchor.year, anchor.month, anchor.day + dayOffset, hour, minute);

    // Bookings are placed 1–7 days before the slot.
    const createdAt = new Date(
      scheduledAt.getTime() - faker.number.int({ min: 1, max: 7 }) * 24 * 60 * 60 * 1000,
    );

    // Quoted price drifts ±20% from the service's list price.
    const variance = faker.number.float({ min: 0.8, max: 1.2, fractionDigits: 4 });
    const amountPaise = Math.round((service.basePricePaise * variance) / 100) * 100;

    referenceSeq += 1;
    const referenceYear = istCalendarDate(scheduledAt).getUTCFullYear();

    return {
      reference: `IM-${referenceYear}-${String(referenceSeq).padStart(6, '0')}`,
      customerId: customer.id,
      vehicleId,
      serviceId: service.id,
      // A pending booking has not been assigned to anyone yet.
      mechanicId: status === 'PENDING' ? null : faker.helpers.arrayElement(mechanics).id,
      status,
      amountPaise,
      scheduledAt,
      scheduledOn: istCalendarDate(scheduledAt),
      completedAt:
        status === 'COMPLETED'
          ? new Date(scheduledAt.getTime() + service.durationMins * 60 * 1000)
          : null,
      createdAt,
      durationMins: service.durationMins,
    };
  }

  for (let i = 0; i < PAST_BOOKINGS; i += 1) {
    // Weight the day so weekends are quieter — a flat distribution makes the
    // "bookings over time" chart look like noise instead of a business.
    let dayOffset = -faker.number.int({ min: 1, max: 89 });
    const weekday = new Date(
      Date.UTC(anchor.year, anchor.month, anchor.day + dayOffset),
    ).getUTCDay();
    if (weekday === 0 && faker.datatype.boolean({ probability: 0.6 })) {
      dayOffset -= 1;
    }

    planned.push(
      planBooking(
        dayOffset,
        faker.helpers.weightedArrayElement([
          { weight: 62, value: 'COMPLETED' as const },
          { weight: 9, value: 'CANCELLED' as const },
          { weight: 4, value: 'PENDING' as const },
          { weight: 4, value: 'ASSIGNED' as const },
          { weight: 3, value: 'ON_THE_WAY' as const },
          { weight: 3, value: 'IN_PROGRESS' as const },
        ]),
      ),
    );
  }

  for (let i = 0; i < TODAY_BOOKINGS; i += 1) {
    planned.push(
      planBooking(
        0,
        faker.helpers.weightedArrayElement([
          { weight: 25, value: 'COMPLETED' as const },
          { weight: 20, value: 'IN_PROGRESS' as const },
          { weight: 20, value: 'ON_THE_WAY' as const },
          { weight: 20, value: 'ASSIGNED' as const },
          { weight: 15, value: 'PENDING' as const },
        ]),
      ),
    );
  }

  for (let i = 0; i < UPCOMING_BOOKINGS; i += 1) {
    // Nothing in the future can be completed or under way.
    planned.push(
      planBooking(
        faker.number.int({ min: 1, max: 7 }),
        faker.helpers.weightedArrayElement([
          { weight: 60, value: 'PENDING' as const },
          { weight: 40, value: 'ASSIGNED' as const },
        ]),
      ),
    );
  }

  console.log(`Writing ${planned.length} bookings...`);
  await prisma.booking.createMany({
    data: planned.map((booking) => ({
      reference: booking.reference,
      customerId: booking.customerId,
      vehicleId: booking.vehicleId,
      serviceId: booking.serviceId,
      mechanicId: booking.mechanicId,
      status: booking.status,
      amountPaise: booking.amountPaise,
      scheduledAt: booking.scheduledAt,
      scheduledOn: booking.scheduledOn,
      completedAt: booking.completedAt,
      createdAt: booking.createdAt,
    })),
  });

  const writtenBookings = await prisma.booking.findMany({ select: { id: true, reference: true } });
  const bookingIdByReference = new Map(writtenBookings.map((b) => [b.reference, b.id]));

  // ---------- booking events ----------
  // Every booking gets the full chain of transitions it has actually been
  // through, with ascending timestamps — this is what the live feed, the
  // booking timeline, and the audit trail all read from.
  console.log('Writing status history...');
  const eventRows: Array<{
    bookingId: number;
    fromStatus: BookingStatus | null;
    toStatus: BookingStatus;
    note: string | null;
    createdAt: Date;
  }> = [];

  for (const booking of planned) {
    const bookingId = bookingIdByReference.get(booking.reference)!;
    const push = (
      fromStatus: BookingStatus | null,
      toStatus: BookingStatus,
      note: string | null,
      createdAt: Date,
    ) => eventRows.push({ bookingId, fromStatus, toStatus, note, createdAt });

    push(null, 'PENDING', 'Booking created', booking.createdAt);

    if (booking.status === 'PENDING') continue;

    if (booking.status === 'CANCELLED') {
      push(
        'PENDING',
        'CANCELLED',
        faker.helpers.arrayElement([
          'Cancelled by customer',
          'Vehicle unavailable',
          'Rescheduled to a later date',
          'No mechanic available in the area',
        ]),
        new Date(booking.createdAt.getTime() + faker.number.int({ min: 1, max: 36 }) * 3600 * 1000),
      );
      continue;
    }

    const assignedAt = new Date(
      booking.createdAt.getTime() + faker.number.int({ min: 1, max: 12 }) * 3600 * 1000,
    );
    push('PENDING', 'ASSIGNED', 'Mechanic assigned', assignedAt);
    if (booking.status === 'ASSIGNED') continue;

    const onTheWayAt = new Date(booking.scheduledAt.getTime() - 30 * 60 * 1000);
    push('ASSIGNED', 'ON_THE_WAY', 'Mechanic en route', onTheWayAt);
    if (booking.status === 'ON_THE_WAY') continue;

    push('ON_THE_WAY', 'IN_PROGRESS', 'Work started', booking.scheduledAt);
    if (booking.status === 'IN_PROGRESS') continue;

    push('IN_PROGRESS', 'COMPLETED', 'Job completed', booking.completedAt!);
  }

  await prisma.bookingEvent.createMany({ data: eventRows });

  // Keep mechanic status coherent with the board: anyone on an active job now
  // reads as ON_JOB rather than whatever was randomly assigned above.
  const busy = await prisma.booking.findMany({
    where: { status: { in: ['ON_THE_WAY', 'IN_PROGRESS'] }, mechanicId: { not: null } },
    select: { mechanicId: true },
  });
  const busyIds = [...new Set(busy.map((b) => b.mechanicId!))];
  await prisma.mechanic.updateMany({
    where: { id: { in: busyIds } },
    data: { status: 'ON_JOB' },
  });

  // Almost every mechanic ends up on an active job, which would leave the
  // status column with no OFF_DUTY rows at all. Rest a few of the idle ones so
  // the mechanics panel and its status filter have something to show.
  const idleIds = mechanics.map((m) => m.id).filter((id) => !busyIds.includes(id));
  await prisma.mechanic.updateMany({
    where: { id: { in: faker.helpers.arrayElements(idleIds, Math.min(4, idleIds.length)) } },
    data: { status: 'OFF_DUTY' },
  });

  // ---------- dashboard users ----------
  console.log('Seeding dashboard users...');
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@instantmechanic.in',
        name: 'Aditya Rao',
        passwordHash,
        role: 'ADMIN',
      },
      {
        email: 'ops@instantmechanic.in',
        name: 'Neha Kulkarni',
        passwordHash,
        role: 'OPS',
      },
    ],
  });

  const [bookingCount, eventCount, revenue] = await Promise.all([
    prisma.booking.count(),
    prisma.bookingEvent.count(),
    prisma.booking.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amountPaise: true },
    }),
  ]);

  console.log('\nSeed complete:');
  console.log(`  service categories : ${CATALOGUE.length}`);
  console.log(`  services           : ${services.length}`);
  console.log(`  customers          : ${customers.length}`);
  console.log(`  vehicles           : ${vehicles.length}`);
  console.log(`  mechanics          : ${mechanics.length}`);
  console.log(`  bookings           : ${bookingCount}`);
  console.log(`  booking events     : ${eventCount}`);
  console.log(
    `  completed revenue  : ₹${((revenue._sum.amountPaise ?? 0) / 100).toLocaleString('en-IN')}`,
  );
  console.log('\n  Login: admin@instantmechanic.in / password123');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
