import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.update({
            where: { email: 'otuturusolomom@gmail.com' },
            data: { tier: 'GOLD' }
        });
        console.log(`Successfully updated ${user.email} to tier ${user.tier}`);
    } catch (e) {
        console.error('Error updating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
