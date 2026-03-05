import prisma from './prisma';

/**
 * Send an in-app notification to a user and log a mock email.
 */
export async function sendNotification(opts: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
}) {
    // 1. In-app notification
    const notification = await prisma.notification.create({
        data: {
            userId: opts.userId,
            title: opts.title,
            message: opts.message,
            type: opts.type || 'INFO',
            link: opts.link
        }
    });

    // 2. Mock email — log to console (replace with real SMTP in production)
    const user = await prisma.user.findUnique({ where: { id: opts.userId }, select: { email: true, name: true } });
    console.log(`\n📧 MOCK EMAIL SENT`);
    console.log(`   To: ${user?.email} (${user?.name})`);
    console.log(`   Subject: ${opts.title}`);
    console.log(`   Body: ${opts.message}`);
    console.log(`   ──────────────────────────\n`);

    return notification;
}

/**
 * Generate a mock payment receipt number.
 */
export function generateReceiptNumber() {
    const yr = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `NAP-${yr}-${rand}`;
}
