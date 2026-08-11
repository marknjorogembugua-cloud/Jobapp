import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Electrical", icon: "zap" },
  { name: "Plumbing", icon: "droplet" },
  { name: "Cleaning", icon: "sparkles" },
  { name: "Painting", icon: "paintbrush" },
  { name: "Construction", icon: "hammer" },
  { name: "Mechanics", icon: "wrench" },
  { name: "Moving", icon: "truck" },
  { name: "Furniture Assembly", icon: "sofa" },
  { name: "Appliance Repair", icon: "settings" },
  { name: "Beauty", icon: "scissors" },
  { name: "Photography", icon: "camera" },
  { name: "Events", icon: "calendar" },
  { name: "Tutoring", icon: "book" },
  { name: "Gardening", icon: "leaf" },
  { name: "Delivery", icon: "package" },
  { name: "Car Wash", icon: "car" },
  { name: "Tailoring", icon: "scissors" },
  { name: "Computer Repair", icon: "laptop" },
  { name: "Phone Repair", icon: "smartphone" },
  { name: "Graphic Design", icon: "pen-tool" },
  { name: "Writing", icon: "edit" },
  { name: "Virtual Assistance", icon: "headphones" },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }
  console.log(`Seeded ${categories.length} categories.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
