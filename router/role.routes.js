import express from 'express';
import { authMiddleware } from '../middlewares/authmiddleware.js';

const router = express.Router();

import {
    createRole,
    getRoles,
    getRolesByUserId,
    attachRole,
    detachRole
} from '../controllers/role.controller.js';
import { checkFields } from '../utils/requestValidate.js';

// Middleware to check authentication
router.use(authMiddleware);
// Route to create a new role
router.post('/', checkFields(['name']), createRole);
// Route to get all roles
router.get('/', getRoles);
// Route to get roles by user ID
router.get('/user/:userId', getRolesByUserId);
// Route to assign a role to a user
router.post('/attach/:userId', attachRole);
// Route to detach a role from a user
router.post('/detach/:userId', detachRole);

export default router;