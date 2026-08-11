import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Bootstraps the first admin account. There is deliberately no API route for
// this — CreateSessionDto only accepts "customer" or "worker" — so promoting
// someone to admin requires direct DB access, run this against a user who has
// already registered once through the app:
//   npm run admin:promote --workspace=apps/api -- someone@example.com
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run admin:promote --workspace=apps/api -- <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email ${email} — they must register in the app first.`);
    process.exit(1);
  }

  await prisma.user.update({ where: { email }, data: { role: "admin" } });
  console.log(`${email} is now an admin.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
