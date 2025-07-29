import express from 'express';

const router = express.Router();
import {
    login,
    register
} from '../controllers/auth.controller.js';
import { checkFields } from '../utils/requestValidate.js';

// Route to login
router.post('/login', checkFields(['username', 'password']), login);
router.post('/register', checkFields(['username', 'name', 'email', 'password']), register);

export default router;