import express from 'express';
import { authMiddleware } from '../middlewares/authmiddleware.js';

const router = express.Router();
import {
    createMenu,
    getMenuByRole,
    attachMenu,
    detachMenu
} from '../controllers/menu.controller.js';
import { checkFields } from '../utils/requestValidate.js';

router.get('/:roleId', authMiddleware, getMenuByRole);
router.post('/create', authMiddleware, checkFields(['name', 'path', 'parentId']), createMenu);
router.post('/attach/:roleId', attachMenu);
router.post('/detach/:roleId', detachMenu);

export default router;