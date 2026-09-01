import "dotenv/config";
import { prisma } from "../src/db";
import { istCalendarDate } from "../src/lib/time";

//can be deleted later.

const rupees = (paise: number | null) =>
  `₹${((paise ?? 0) / 100).toLocaleString("en-IN")}`;

async function main(): Promise<void> {
  const today = istCalendarDate(new Date());
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );

  // 1 — overview tiles
  const [total, todayCount, revenue, activeMechanics, newCustomers] =
    await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { scheduledOn: today } }),
      prisma.booking.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amountPaise: true },
      }),
      prisma.mechanic.count({
        where: { status: { in: ["AVAILABLE", "ON_JOB"] } },
      }),
      prisma.customer.count({ where: { createdAt: { gte: monthStart } } }),
    ]);
  const newCustomersRolling = await prisma.customer.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  console.log("--- overview ---");
  console.log(`total bookings   : ${total}`);
  console.log(`today's bookings : ${todayCount}`);
  console.log(`total revenue    : ${rupees(revenue._sum.amountPaise)}`);
  console.log(`active mechanics : ${activeMechanics}`);
  console.log(
    `new customers    : ${newCustomers} (calendar month) / ${newCustomersRolling} (rolling 30d)`,
  );

  // 2 — status breakdown (donut)
  const byStatus = await prisma.booking.groupBy({
    by: ["status"],
    _count: { _all: true },
    orderBy: { status: "asc" },
  });
  console.log("\n--- by status ---");
  for (const row of byStatus)
    console.log(`${row.status.padEnd(12)} ${row._count._all}`);

  // 3 — bookings + revenue over time (line/area charts)
  const daily = await prisma.booking.groupBy({
    by: ["scheduledOn"],
    where: { scheduledOn: { gte: thirtyDaysAgo, lte: today } },
    _count: { _all: true },
    _sum: { amountPaise: true },
    orderBy: { scheduledOn: "asc" },
  });
  console.log(`\n--- daily buckets (last 30 days): ${daily.length} ---`);
  for (const row of daily.slice(-5)) {
    console.log(
      `${row.scheduledOn.toISOString().slice(0, 10)}  ${String(row._count._all).padStart(2)} bookings  ${rupees(row._sum.amountPaise)}`,
    );
  }

  // 4 — service category breakdown (needs a join through Service)
  const byService = await prisma.service.findMany({
    select: {
      name: true,
      category: { select: { name: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { bookings: { _count: "desc" } },
    take: 5,
  });
  console.log("\n--- top services ---");
  for (const row of byService) {
    console.log(
      `${row._count.bookings.toString().padStart(3)}  ${row.category.name} / ${row.name}`,
    );
  }

  // 5 — mechanics panel: jobs completed + current/last booking
  const mechanics = await prisma.mechanic.findMany({
    take: 5,
    select: {
      name: true,
      status: true,
      _count: { select: { bookings: { where: { status: "COMPLETED" } } } },
      bookings: {
        take: 1,
        orderBy: { scheduledAt: "desc" },
        select: { reference: true, status: true },
      },
    },
    orderBy: { bookings: { _count: "desc" } },
  });
  console.log("\n--- mechanics ---");
  for (const m of mechanics) {
    const last = m.bookings[0];
    console.log(
      `${m.name.padEnd(22)} ${m.status.padEnd(10)} ${String(m._count.bookings).padStart(2)} done  last: ${last ? `${last.reference} (${last.status})` : "—"}`,
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
