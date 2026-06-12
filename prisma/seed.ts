import * as dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const COUNTRIES = [
  { name: "Pakistan", code: "PK" },
  { name: "Turkey", code: "TR" },
  { name: "Japan", code: "JP" },
  { name: "Italy", code: "IT" },
  { name: "Morocco", code: "MA" },
  { name: "Thailand", code: "TH" },
  { name: "India", code: "IN" },
  { name: "United Kingdom", code: "GB" },
  { name: "France", code: "FR" },
  { name: "United States", code: "US" },
];

const CITIES: Record<string, string[]> = {
  PK: ["Karachi", "Lahore", "Islamabad", "Peshawar", "Quetta", "Multan", "Rawalpindi", "Faisalabad"],
  TR: ["Istanbul", "Ankara", "Izmir", "Cappadocia", "Antalya"],
  JP: ["Tokyo", "Kyoto", "Osaka", "Hiroshima", "Sapporo"],
  IT: ["Rome", "Florence", "Venice", "Milan", "Naples"],
  MA: ["Marrakech", "Fez", "Casablanca", "Chefchaouen", "Tangier"],
  TH: ["Bangkok", "Chiang Mai", "Phuket", "Pai", "Koh Samui"],
  IN: ["Mumbai", "Delhi", "Bangalore", "Jaipur", "Varanasi"],
  GB: ["London", "Edinburgh", "Manchester", "Bristol", "Bath"],
  FR: ["Paris", "Lyon", "Nice", "Bordeaux", "Marseille"],
  US: ["New York", "Los Angeles", "Chicago", "New Orleans", "Portland"],
};

async function main() {
  console.log("🌱 Seeding database...");

  for (const country of COUNTRIES) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country,
    });
  }
  console.log("✅ Countries seeded (10)");

  const countries = await prisma.country.findMany();
  let cityCount = 0;
  for (const country of countries) {
    const cityNames = CITIES[country.code] ?? [];
    for (const name of cityNames) {
      await prisma.city.upsert({
        where: { name_countryId: { name, countryId: country.id } },
        update: {},
        create: { name, countryId: country.id },
      });
      cityCount++;
    }
  }
  console.log(`✅ Cities seeded (${cityCount})`);

  // Update full-text search vectors
  await prisma.$executeRaw`
    UPDATE cities SET search_vec = to_tsvector('english', name)
  `;
  console.log("✅ FTS vectors updated");

  console.log("🎉 Seed complete! Ready to submit places.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
