import prisma from '../prisma/client.js';
import { comparePassword, createToken, hashPassword } from '../utils/jwt.js';

export const login = async (req, res) => {
    const { username, password } = req.body;
    const deviceId = req.headers['x-device-id'];

    if (!deviceId) {
        return res.status(400).json({ message: 'Device Id belum dikirim' });
    }

    const user = await prisma.user.findUnique({
        where: {
            username: username,
        },
    });
    if (!user) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    if (comparePassword(password, user.password) === false) {
        return res.status(401).json({ message: 'Password salah' });
    }

    const accessToken = createToken({
        id: user.id,
        username: user.username,
        email: user.email,
        deviceId: deviceId
    });

    return res.status(200).json({
        message: 'Login user sukses',
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email
        },
        token: accessToken
    });
}

export const register = async (req, res) => {
    const { username, password, name, email } = req.body;
    const deviceId = req.headers['x-device-id'];

    // validate username and password
    if (username.length < 3 || password.length < 6) {
        return res.status(400).json({ message: 'Username harus minimal 3 karakter dan Password minimal 6 karakter' });
    }
    // check if username is valid
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        return res.status(400).json({ message: 'Username hanya dapat berisi huruf, angka, dan garis bawah' });
    }
    // check if password is valid
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: 'Password harus minimal 6 karakter dan mengandung setidaknya satu huruf besar, satu huruf kecil, dan satu angka.' });
    }
    // check if password is the same as username
    if (username === password) {
        return res.status(400).json({ message: 'Password tidak boleh sama dengan username' });
    }
    // check if password contains username
    if (password.includes(username)) {
        return res.status(400).json({ message: 'Password tidak boleh berisi username' });
    }
    // check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Format email tidak valid' });
    }

    // check if user already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [{ email }, { username }],
        },
    });
    if (existingUser) {
        return res.status(409).json({ message: 'User sudah ada' });
    }

    // create new user
    const newUser = await prisma.user.create({
        data: {
            name: name,
            email: email,
            username: username,
            password: hashPassword(password),
        },
    });

    // create token or session here if needed with jsonwebtoken
    const accessToken = createToken({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        deviceId: deviceId
    });

    return res.status(201).json({
        message: 'User berhasil registrasi',
        user: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            email: newUser.email
        },
        token: accessToken
    });
}