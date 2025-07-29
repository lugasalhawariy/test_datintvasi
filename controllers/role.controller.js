import prisma from "../prisma/client.js";

export const createRole = async (req, res) => {
    const { name } = req.body;

    const nameLower = name.toLowerCase();

    try {
        // Check if role already exists
        const existingRole = await prisma.role.findUnique({
            where: {
                name: nameLower,
            },
        });
        if (existingRole) {
            return res.status(409).json({ message: 'Role already exists' });
        }
        // Create role in the database
        const role = await prisma.role.create({
            data: {
                name: nameLower,
            },
        });

        return res.status(201).json(role);
    } catch (error) {
        console.error('Error creating role:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const getRoles = async (req, res) => {
    try {
        // Fetch all roles from the database
        const roles = await prisma.role.findMany();
        return res.status(200).json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const getRolesByUserId = async (req, res) => {
    const { userId } = req.params;
    try {
        // Fetch roles by user ID
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        const roles = await prisma.userRole.findMany({
            where: {
                userId: userId,
            },
            select: {
                id: true,
                createdAt: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return res.status(200).json(roles);
    } catch (error) {
        console.error('Error fetching roles by user ID:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const attachRole = async (req, res) => {
    const { roleIds } = req.body;
    const { userId } = req.params;
    const user = req.user;

    try {
        // Attach role to user
        // 1) Pastikan semua roleId valid sekali jalan
        const found = await prisma.role.findMany({
            where: { id: { in: roleIds } },
            select: { id: true },
        });
        if (found.length !== roleIds.length) {
            return res.status(404).json({ message: 'Beberapa role tidak ditemukan' });
        }

        // 2) Pastikan user valid
        const foundUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!foundUser) {
            return res.status(404).json({ message: 'Data user tidak ditemukan' });
        }

        // 2) Buat (atau skip jika sudah ada) baris UserRole secara massal
        await prisma.userRole.createMany({
            data: roleIds.map(roleId => ({ userId, roleId, updateBy: user.id })),
            skipDuplicates: true,  // abaikan relasi yang sudah ada
        });

        return res.status(200).json({ message: 'Roles attached successfully' });
    } catch (error) {
        console.error('Error attaching role:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const detachRole = async (req, res) => {
    const { roleIds, userId } = req.body;

    try {
        // Detach role from user
        await prisma.userRole.deleteMany({
            where: {
                userId,
                roleId: { in: roleIds },
            },
        });

        return res.status(200).json({ message: 'Roles detached successfully' });
    } catch (error) {
        console.error('Error detaching role:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}