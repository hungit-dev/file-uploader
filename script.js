import { prisma } from './lib/prisma.js';

async function main() {
  // Create a new user with a post

}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })