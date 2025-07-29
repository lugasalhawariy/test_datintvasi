import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            email: user.email,
            deviceId: user.deviceId
        },
        SECRET_KEY,
        {
            expiresIn: '1d' // token berlaku 1 hari
        }
    )
}

export const createToken = (user, type) => {
    if (!user || !user.id || !user.username) {
        throw new Error('Invalid user data for token creation');
    }
    return generateToken(user, type);
}

export const verifyToken = (token) => {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        throw new Error('Invalid token');
    }
}

export const comparePassword = (plainPassword, hashedPassword) => {
    if (!plainPassword || !hashedPassword) {
        throw new Error('Both plain and hashed passwords are required for comparison');
    }
    return bcrypt.compareSync(plainPassword, hashedPassword);
}

export const hashPassword = (password) => {
    if (!password) {
        throw new Error('Password is required for hashing');
    }
    return bcrypt.hashSync(password, 10); // 10 is the salt rounds
}