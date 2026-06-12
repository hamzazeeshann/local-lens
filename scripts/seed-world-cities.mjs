import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// CountriesNow API gives us country + cities in one call — no other API needed
async function main() {
  console.log("🌍 Fetching countries + cities from CountriesNow API...");

  let data;
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries", {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(30000),
    });
    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) throw new Error("Bad response from CountriesNow");
    data = json.data;
  } catch (e) {
    console.error("❌ CountriesNow API failed:", e.message);
    console.log("📦 Falling back to built-in starter cities...");
    data = getFallbackData();
  }

  console.log(`✅ Got ${data.length} countries`);

  // ISO-2 code lookup — common country names to codes
  const CODE_MAP = {
    "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Argentina": "AR",
    "Australia": "AU", "Austria": "AT", "Bangladesh": "BD", "Belgium": "BE",
    "Brazil": "BR", "Canada": "CA", "Chile": "CL", "China": "CN",
    "Colombia": "CO", "Czech Republic": "CZ", "Denmark": "DK", "Egypt": "EG",
    "Ethiopia": "ET", "Finland": "FI", "France": "FR", "Germany": "DE",
    "Ghana": "GH", "Greece": "GR", "Hungary": "HU", "India": "IN",
    "Indonesia": "ID", "Iran": "IR", "Iraq": "IQ", "Ireland": "IE",
    "Israel": "IL", "Italy": "IT", "Japan": "JP", "Jordan": "JO",
    "Kazakhstan": "KZ", "Kenya": "KE", "Malaysia": "MY", "Mexico": "MX",
    "Morocco": "MA", "Myanmar": "MM", "Nepal": "NP", "Netherlands": "NL",
    "New Zealand": "NZ", "Nigeria": "NG", "Norway": "NO", "Pakistan": "PK",
    "Peru": "PE", "Philippines": "PH", "Poland": "PL", "Portugal": "PT",
    "Romania": "RO", "Russia": "RU", "Saudi Arabia": "SA", "Senegal": "SN",
    "Serbia": "RS", "Singapore": "SG", "South Africa": "ZA", "South Korea": "KR",
    "Spain": "ES", "Sri Lanka": "LK", "Sudan": "SD", "Sweden": "SE",
    "Switzerland": "CH", "Syria": "SY", "Taiwan": "TW", "Tanzania": "TZ",
    "Thailand": "TH", "Tunisia": "TN", "Turkey": "TR", "Uganda": "UG",
    "Ukraine": "UA", "United Arab Emirates": "AE", "United Kingdom": "GB",
    "United States": "US", "Uzbekistan": "UZ", "Venezuela": "VE",
    "Vietnam": "VN", "Yemen": "YE", "Zimbabwe": "ZW", "Kuwait": "KW",
    "Qatar": "QA", "Bahrain": "BH", "Oman": "OM", "Libya": "LY",
    "Lebanon": "LB", "Cyprus": "CY", "Slovakia": "SK", "Croatia": "HR",
    "Bulgaria": "BG", "Belarus": "BY", "Azerbaijan": "AZ", "Armenia": "AM",
    "Georgia": "GE", "Moldova": "MD", "Ecuador": "EC", "Bolivia": "BO",
    "Paraguay": "PY", "Uruguay": "UY", "Panama": "PA", "Guatemala": "GT",
    "Honduras": "HN", "El Salvador": "SV", "Nicaragua": "NI", "Costa Rica": "CR",
    "Cuba": "CU", "Dominican Republic": "DO", "Haiti": "HT", "Jamaica": "JM",
    "Cameroon": "CM", "Ivory Coast": "CI", "Madagascar": "MG", "Mali": "ML",
    "Mozambique": "MZ", "Niger": "NE", "Rwanda": "RW", "Somalia": "SO",
    "Zambia": "ZM", "Angola": "AO", "Congo": "CG",
    "Democratic Republic of the Congo": "CD", "Benin": "BJ", "Burundi": "BI",
    "Djibouti": "DJ", "Eritrea": "ER", "Gabon": "GA", "Gambia": "GM",
    "Guinea": "GN", "Liberia": "LR", "Malawi": "MW", "Mauritania": "MR",
    "Sierra Leone": "SL", "Togo": "TG", "Afghanistan": "AF",
    "New Zealand": "NZ", "Papua New Guinea": "PG", "Fiji": "FJ",
  };

  // Wipe and re-seed
  await prisma.city.deleteMany();
  await prisma.country.deleteMany();

  const countryRows = [];
  const seen = new Set();
  for (const item of data) {
    if (!item.country || seen.has(item.country)) continue;
    seen.add(item.country);
    const code = CODE_MAP[item.country] || item.country.slice(0, 2).toUpperCase();
    countryRows.push({ name: item.country, code });
  }

  console.log(`📦 Inserting ${countryRows.length} countries...`);
  await prisma.country.createMany({ data: countryRows, skipDuplicates: true });

  const dbCountries = await prisma.country.findMany({ select: { id: true, name: true } });
  const countryIdByName = new Map(dbCountries.map((c) => [c.name, c.id]));

  const cityRows = [];
  for (const item of data) {
    const countryId = countryIdByName.get(item.country);
    if (!countryId) continue;
    const cities = Array.isArray(item.cities) ? item.cities : [];
    for (const cityName of cities) {
      if (!cityName || typeof cityName !== "string") continue;
      cityRows.push({ name: cityName.trim(), countryId });
    }
  }

  console.log(`🏙️  Inserting ${cityRows.length} cities in batches...`);
  const BATCH = 500;
  for (let i = 0; i < cityRows.length; i += BATCH) {
    await prisma.city.createMany({ data: cityRows.slice(i, i + BATCH), skipDuplicates: true });
    process.stdout.write(`\r   ${Math.min(i + BATCH, cityRows.length)} / ${cityRows.length}`);
  }
  console.log();

  // Update FTS search vectors
  await prisma.$executeRaw`UPDATE cities SET search_vec = to_tsvector('simple', name)`;
  console.log("✅ FTS vectors updated");
  console.log("🎉 World cities seed complete!");
}

function getFallbackData() {
  return [
    { country: "Pakistan", cities: ["Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Peshawar","Quetta","Sialkot","Gujranwala","Hyderabad","Bahawalpur","Sargodha","Sukkur","Larkana","Sheikhupura","Jhang","Rahim Yar Khan","Gujrat","Kasur","Mardan","Mingora","Nawabshah","Sahiwal","Mirpur Khas","Okara","Burewala","Jacobabad","Saidpur","Kohat"] },
    { country: "United States", cities: ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","San Jose","Austin","Jacksonville","Fort Worth","Columbus","Charlotte","San Francisco","Indianapolis","Seattle","Denver","Nashville","Oklahoma City","El Paso","Boston","Portland","Las Vegas","Memphis","Louisville","Baltimore","Milwaukee","Albuquerque"] },
    { country: "United Kingdom", cities: ["London","Birmingham","Manchester","Leeds","Glasgow","Liverpool","Sheffield","Edinburgh","Bristol","Cardiff","Leicester","Coventry","Nottingham","Bradford","Newcastle","Stoke-on-Trent","Southampton","Derby","Portsmouth","Brighton"] },
    { country: "India", cities: ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Kolkata","Ahmedabad","Pune","Surat","Jaipur","Lucknow","Kanpur","Nagpur","Indore","Thane","Bhopal","Visakhapatnam","Patna","Vadodara","Ghaziabad","Ludhiana","Agra","Nashik","Faridabad","Meerut","Rajkot","Varanasi","Srinagar","Aurangabad","Dhanbad"] },
    { country: "China", cities: ["Shanghai","Beijing","Chongqing","Tianjin","Guangzhou","Shenzhen","Wuhan","Dongguan","Chengdu","Nanjing","Foshan","Shenyang","Hangzhou","Xi'an","Harbin","Suzhou","Qingdao","Dalian","Zhengzhou","Jinan","Changsha","Kunming","Hefei","Nanning","Changchun","Taiyuan","Shijiazhuang","Guiyang","Nanchang","Urumqi"] },
    { country: "Germany", cities: ["Berlin","Hamburg","Munich","Cologne","Frankfurt","Stuttgart","Düsseldorf","Leipzig","Dortmund","Essen","Bremen","Dresden","Hanover","Nuremberg","Duisburg","Bochum","Wuppertal","Bielefeld","Bonn","Münster"] },
    { country: "France", cities: ["Paris","Marseille","Lyon","Toulouse","Nice","Nantes","Strasbourg","Montpellier","Bordeaux","Lille","Rennes","Reims","Le Havre","Saint-Étienne","Toulon","Grenoble","Dijon","Angers","Nîmes","Villeurbanne"] },
    { country: "Turkey", cities: ["Istanbul","Ankara","Izmir","Bursa","Adana","Gaziantep","Konya","Antalya","Kayseri","Mersin","Eskisehir","Diyarbakir","Samsun","Denizli","Adapazari","Malatya","Kahramanmaras","Erzurum","Van","Batman"] },
    { country: "Brazil", cities: ["São Paulo","Rio de Janeiro","Brasília","Salvador","Fortaleza","Belo Horizonte","Manaus","Curitiba","Recife","Porto Alegre","Belém","Goiânia","Guarulhos","Campinas","São Luís","São Gonçalo","Maceió","Natal","Teresina","Campo Grande"] },
    { country: "Russia", cities: ["Moscow","Saint Petersburg","Novosibirsk","Yekaterinburg","Kazan","Nizhny Novgorod","Chelyabinsk","Samara","Omsk","Rostov-on-Don","Ufa","Krasnoyarsk","Voronezh","Perm","Volgograd","Krasnodar","Saratov","Tyumen","Tolyatti","Izhevsk"] },
    { country: "Australia", cities: ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast","Canberra","Newcastle","Wollongong","Sunshine Coast","Hobart","Geelong","Townsville","Cairns","Darwin","Toowoomba","Ballarat","Bendigo","Launceston","Mackay"] },
    { country: "Japan", cities: ["Tokyo","Yokohama","Osaka","Nagoya","Sapporo","Kobe","Kyoto","Fukuoka","Kawasaki","Saitama","Hiroshima","Sendai","Kitakyushu","Chiba","Sakai","Kumamoto","Okayama","Shizuoka","Hamamatsu","Sagamihara"] },
    { country: "Italy", cities: ["Rome","Milan","Naples","Turin","Palermo","Genoa","Bologna","Florence","Bari","Catania","Venice","Verona","Messina","Padua","Trieste","Taranto","Brescia","Reggio Calabria","Modena","Prato"] },
    { country: "Spain", cities: ["Madrid","Barcelona","Valencia","Seville","Zaragoza","Málaga","Murcia","Palma","Las Palmas","Bilbao","Alicante","Córdoba","Valladolid","Vigo","Gijón","Hospitalet","A Coruña","Vitoria","Granada","Elche"] },
    { country: "Canada", cities: ["Toronto","Montreal","Vancouver","Calgary","Edmonton","Ottawa","Winnipeg","Quebec City","Hamilton","Kitchener","London","Victoria","Halifax","Saskatoon","Regina","St. John's","Kelowna","Barrie","Abbotsford","Windsor"] },
    { country: "United Arab Emirates", cities: ["Dubai","Abu Dhabi","Sharjah","Al Ain","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain","Khor Fakkan","Kalba","Madinat Zayed","Ruwais","Liwa Oasis"] },
    { country: "Saudi Arabia", cities: ["Riyadh","Jeddah","Mecca","Medina","Dammam","Taif","Tabuk","Buraidah","Khobar","Abha","Najran","Jizan","Yanbu","Al Qatif","Hail","Hofuf","Jubail","Khamis Mushait","Arar","Sakaka"] },
    { country: "Mexico", cities: ["Mexico City","Guadalajara","Monterrey","Puebla","Toluca","Tijuana","León","Ciudad Juárez","Torreón","Querétaro","San Luis Potosí","Mérida","Aguascalientes","Mexicali","Culiacán","Acapulco","Tampico","Chihuahua","Morelia","Hermosillo"] },
    { country: "Egypt", cities: ["Cairo","Alexandria","Giza","Shubra El Kheima","Port Said","Suez","Luxor","Mansoura","El Mahalla El Kubra","Tanta","Asyut","Ismailia","Fayyum","Zagazig","Aswan","Damietta","Damanhur","Minya","Beni Suef","Hurghada"] },
    { country: "South Africa", cities: ["Johannesburg","Cape Town","Durban","Pretoria","Port Elizabeth","Bloemfontein","Nelspruit","Polokwane","East London","Kimberley","Pietermaritzburg","Rustenburg","Vereeniging","George","Potchefstroom"] },
    { country: "Nigeria", cities: ["Lagos","Kano","Ibadan","Abuja","Port Harcourt","Benin City","Maiduguri","Zaria"," Jos","Ilorin","Oyo","Enugu","Abeokuta","Onitsha","Warri","Sokoto","Kaduna","Calabar","Uyo","Asaba"] },
    { country: "Netherlands", cities: ["Amsterdam","Rotterdam","The Hague","Utrecht","Eindhoven","Groningen","Tilburg","Almere","Breda","Nijmegen","Enschede","Apeldoorn","Haarlem","Arnhem","Zaanstad","Amersfoort","Haarlemmermeer","Den Bosch","Dordrecht","Leiden"] },
    { country: "Indonesia", cities: ["Jakarta","Surabaya","Bandung","Medan","Bekasi","Tangerang","Depok","Semarang","Palembang","Makassar","South Tangerang","Batam","Pekanbaru","Bandar Lampung","Padang","Malang","Bogor","Denpasar","Samarinda","Manado"] },
    { country: "Bangladesh", cities: ["Dhaka","Chittagong","Sylhet","Rajshahi","Khulna","Barisal","Comilla","Narayanganj","Rangpur","Mymensingh","Jessore","Gazipur","Tongi","Narsingdi","Bogra","Dinajpur","Sirajganj","Brahmanbaria","Tangail","Pabna"] },
    { country: "Argentina", cities: ["Buenos Aires","Córdoba","Rosario","Mendoza","Tucumán","La Plata","Mar del Plata","Salta","Santa Fe","San Juan","Resistencia","Santiago del Estero","Corrientes","Neuquén","Bahía Blanca","Formosa","Posadas","San Luis","Río Cuarto","Comodoro Rivadavia"] },
    { country: "Thailand", cities: ["Bangkok","Nonthaburi","Pak Kret","Hat Yai","Chiang Mai","Udon Thani","Khon Kaen","Nakhon Ratchasima","Chon Buri","Phuket","Songkhla","Ubon Ratchathani","Chiang Rai","Phitsanulok","Samut Prakan"] },
    { country: "Malaysia", cities: ["Kuala Lumpur","George Town","Ipoh","Shah Alam","Petaling Jaya","Subang Jaya","Johor Bahru","Kota Kinabalu","Kuching","Klang","Seremban","Melaka","Alor Setar","Kota Bharu","Sandakan","Miri","Sibu","Kuala Terengganu","Taiping"] },
    { country: "Kenya", cities: ["Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Thika","Malindi","Kitale","Garissa","Kakamega","Nyeri","Machakos","Kericho","Lamu","Embu","Migori","Meru","Kilifi","Homa Bay","Naivasha"] },
    { country: "Morocco", cities: ["Casablanca","Rabat","Fez","Marrakech","Agadir","Tangier","Meknes","Oujda","Kenitra","Tetouan","Safi","El Jadida","Beni Mellal","Nador","Taza","Settat","Berrechid","Khemisset","Guelmim","Laayoune"] },
    { country: "Poland", cities: ["Warsaw","Kraków","Łódź","Wrocław","Poznań","Gdańsk","Szczecin","Bydgoszcz","Lublin","Białystok","Katowice","Gdynia","Częstochowa","Radom","Sosnowiec","Toruń","Kielce","Rzeszów","Gliwice","Zabrze"] },
  ];
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
