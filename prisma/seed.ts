import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Sample seed data — cities from Pakistan + popular travel destinations
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

  // Countries
  for (const country of COUNTRIES) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country,
    });
  }
  console.log("✅ Countries seeded");

  // Cities
  const countries = await prisma.country.findMany();
  for (const country of countries) {
    const cityNames = CITIES[country.code] ?? [];
    for (const name of cityNames) {
      await prisma.city.upsert({
        where: { name_countryId: { name, countryId: country.id } },
        update: {},
        create: { name, countryId: country.id },
      });
    }
  }
  console.log("✅ Cities seeded");

  // Update full-text search vectors
  await prisma.$executeRaw`
    UPDATE cities SET search_vec = to_tsvector('english', name)
  `;
  console.log("✅ FTS vectors updated");

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
