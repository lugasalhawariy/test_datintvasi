import jwt from 'jsonwebtoken'
import prisma from '../prisma/client.js' // sesuaikan dengan path kamu
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' })
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, JWT_SECRET)

        // Ambil user dari database jika perlu
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, username: true }
        })

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: User not found' })
        }

        req.user = user
        next()
    } catch (error) {
        console.error(error)
        return res.status(401).json({ message: 'Unauthorized: Invalid token' })
    }
}