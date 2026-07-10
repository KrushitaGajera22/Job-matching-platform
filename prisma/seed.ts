import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcrypt';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // We hash the password before saving it!
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10);

  const adminUser = await prisma.user.upsert({
    // 1. Added the ! to ADMIN_EMAIL to silence TypeScript
    where: { email: process.env.ADMIN_EMAIL! },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: process.env.ADMIN_EMAIL!,
      password: hashedPassword,
      role: 'ADMIN', // 2. Added the required role field!
    },
  });

  console.log('Admin user successfully created/updated:', adminUser.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
