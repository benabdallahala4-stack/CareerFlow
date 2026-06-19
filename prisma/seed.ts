import { PrismaClient } from "@prisma/client";
import { LOCAL_USER_ID } from "../src/lib/constants";

const db = new PrismaClient();

async function main() {
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: { id: LOCAL_USER_ID, email: "me@local", name: "Me" },
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

  console.log("Seed complete.");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
