import prisma from "../prisma/client.js"


export const createMenu = async (req, res) => {
    const { name, path, parentId } = req.body;

    if (!name || !path) {
        return res.status(400).json({ error: 'Name and path are required' });
    }

    try {
        // Validasi parent jika diberikan
        if (parentId) {
            const parentExists = await prisma.menu.findUnique({
                where: { id: parentId },
            });

            if (!parentExists) {
                return res.status(404).json({ error: 'Parent menu not found' });
            }
        }

        const newMenu = await prisma.menu.create({
            data: {
                name,
                path,
                parentId: parentId || null,
            },
        });

        return res.status(201).json({ message: 'Menu created', data: newMenu });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to create menu' });
    }
};

export const getMenuByRole = async (req, res) => {
    try {
        const { roleId } = req.params;
        if (!roleId) {
            return res.status(400).json({
                message: 'Role ID tidak belum dikirim'
            })
        }
        const menus = await getMenusByRole(roleId)
        return res.status(200).json({
            message: 'Data berhasil diambil',
            data: menus
        })
    } catch (error) {
        return res.status(500).json({
            message: 'Error Server!'
        })
    }
}

async function getMenusByRole(roleId) {
    // Step 1: Ambil semua menuId dari role
    const roleMenus = await prisma.roleMenu.findMany({
        where: { roleId },
        select: { menuId: true }
    });

    const roleMenuIds = new Set(roleMenus.map(m => m.menuId));

    // Step 2: Ambil semua menu (karena parent bisa di luar roleMenu)
    const allMenus = await prisma.menu.findMany();

    // Step 3: Buat map menuId -> menu
    const menuMap = new Map();
    for (const menu of allMenus) {
        menuMap.set(menu.id, { ...menu, children: [] });
    }

    // Step 4: Buat relasi parent-child
    const tree = [];
    for (const menu of allMenus) {
        if (menu.parentId) {
            const parent = menuMap.get(menu.parentId);
            if (parent) {
                parent.children.push(menuMap.get(menu.id));
            }
        }
    }

    // Step 5: Ambil menu root yang dimiliki oleh role, lalu bangun tree rekursifnya
    function collectMenuTree(menu) {
        return {
            id: menu.id,
            name: menu.name,
            path: menu.path,
            children: (menu.children || []).map(collectMenuTree)
        };
    }

    const result = [];
    for (const menu of allMenus) {
        if (!menu.parentId && roleMenuIds.has(menu.id)) {
            const fullTree = collectMenuTree(menuMap.get(menu.id));
            result.push(fullTree);
        }
    }

    return result;
}

export const attachMenu = async (req, res) => {
    const { menuIds } = req.body;
    const { roleId } = req.params;
    const user = req.user;

    try {
        const found = await prisma.menu.findMany({
            where: { id: { in: menuIds } },
            select: { id: true },
        });
        if (found.length !== menuIds.length) {
            return res.status(404).json({ message: 'Beberapa menu ID tidak ditemukan' });
        }

        // 2) Buat (atau skip jika sudah ada) baris UserRole secara massal
        await prisma.roleMenu.createMany({
            data: menuIds.map(menuId => ({ roleId, menuId, updateBy: user.id })),
            skipDuplicates: true,  // abaikan relasi yang sudah ada
        });

        return res.status(200).json({ message: 'Sukses menyambungkan menu ke role' });
    } catch (error) {
        console.error('Gagal menyambungkan menu ke role:', error);
        return res.status(500).json({ message: 'Gagal menyambungkan menu ke role' });
    }
}

export const detachMenu = async (req, res) => {
    const { menuIds, roleId } = req.body;

    try {
        // Detach role from user
        await prisma.roleMenu.deleteMany({
            where: {
                roleId,
                menuId: { in: menuIds },
            },
        });

        return res.status(200).json({ message: 'Sukses memutus menu dari role' });
    } catch (error) {
        console.error('Gagal memutus menu dari role:', error);
        return res.status(500).json({ message: 'Gagal memutus menu dari role' });
    }
}