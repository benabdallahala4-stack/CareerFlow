import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { LOCAL_USER_ID } from "../src/lib/constants";

const db = new PrismaClient();

const DEMO_EMAIL = "demo@careerflow.local";
const DEMO_PASSWORD = "password";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: { email: DEMO_EMAIL, passwordHash },
    create: { id: LOCAL_USER_ID, email: DEMO_EMAIL, name: "Demo", passwordHash },
  });

  const count = await db.job.count({ where: { userId: LOCAL_USER_ID } });
  if (count === 0) {
    const acme = await db.company.create({
      data: { userId: LOCAL_USER_ID, name: "Acme Corp", location: "Remote" },
    });
    await db.job.createMany({
      data: [
        { userId: LOCAL_USER_ID, companyId: acme.id, title: "Backend Engineer", status: "APPLIED", boardOrder: 0 },
        { userId: LOCAL_USER_ID, companyId: acme.id, title: "Full-Stack Developer", status: "WISHLIST", boardOrder: 0 },
      ],
    });
  }

  console.log(`Seed complete. Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
