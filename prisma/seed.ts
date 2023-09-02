import { PrismaClient, SeasonName } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [user, season] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'aimendayambaje24@gmail.com' },
      update: {},
      create: {
        email: 'aimendayambaje24@gmail.com',
        firstName: 'Aime',
        lastName: 'Ndayambaje',
        password:
          '$2b$10$3LgMdSM8Up/PSZ5VxpR3pOLVOYrv9hDaYVYJg.Du4jZBwrA.PvFhi',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        verified: true,
        profile: {
          create: {
            id: '64d4b0502e1b7b16a3cf5022',
            username: 'aimelive250',
            profilePic:
              'https://res.cloudinary.com/dofeqwgfb/image/upload/v1691660367/FlipSide-Hosting-Images/tmcql2lcsd4bwfvdsegq.jpg',
            bio: 'The best rapper you should know',
          },
        },
      },
      include: { profile: true },
    }),
    prisma.season.upsert({
      where: { name: SeasonName.SEASON_3 },
      update: {},
      create: { name: SeasonName.SEASON_3, date: new Date('2023-05-05') },
    }),
  ]);

  console.log({ user, season });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit();
  });
