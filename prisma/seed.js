import { PrismaClient } from '@prisma/client';
import {
    hashPassword
} from '../utils/jwt.js';
const prisma = new PrismaClient();

const DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL
const DEVELOPER_USERNAME = process.env.DEVELOPER_USERNAME
const DEVELOPER_PASSWORD = process.env.DEVELOPER_PASSWORD

async function main() {

    const menus = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Users', path: '/users' },
        { name: 'Roles', path: '/roles' },
        { name: 'Setting', path: '/setting' },
        { name: 'Finance', path: '/finance' },
        { name: 'Content', path: '/content' },
        { name: 'About', path: '/about' },
    ];

    for (const menu of menus) {
        await prisma.menu.upsert({
            where: { name: menu.name },
            update: {},  // tidak mengubah relasi apa pun
            create: { name: menu.name, path: menu.path },
        });
    }

    /* 2️⃣  Seed Role – tanpa relasi */
    const roles = [
        'developer',
        'manager',
        'assistant',
        'user',
        'bendahara'
    ];
    for (const name of roles) {
        await prisma.role.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }

    const user_developer = await prisma.user.create({
        data: {
            name: "Developer",
            email: DEVELOPER_EMAIL,
            username: DEVELOPER_USERNAME,
            password: hashPassword(DEVELOPER_PASSWORD)
        }
    });
    const role_developer = await prisma.role.findUnique({ where: { name: "developer" } });
    await prisma.userRole.create({
        data: {
            userId: user_developer.id,
            roleId: role_developer.id,
            updateBy: user_developer.id
        }
    })
    // attach permissions ke role
    const roleMenus = [
        { roleName: 'developer', menus: ['Dashboard', 'Setting', 'Roles', 'About'] },
        { roleName: 'manager', menus: ['Dashboard', 'Users', 'Roles', 'Finance', 'Content', 'About'] }
    ];

    for (const { roleName, menus } of roleMenus) {
        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (!role) continue; // jika role tidak ditemukan, lewati

        for (const menuName of menus) {
            const menu = await prisma.menu.findUnique({ where: { name: menuName } });
            if (!menu) continue;

            await prisma.roleMenu.upsert({
                where: {
                    roleId_menuId: {
                        roleId: role.id,
                        menuId: menu.id
                    },
                },
                update: {},  // tidak mengubah relasi apa pun
                create: {
                    roleId: role.id,
                    menuId: menu.id,
                    updateBy: user_developer.id
                },
            });
        }
    }

    console.log('✅ Seeder selesai: Role & Permission dibuat');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
