import express from 'express';
import { upload, uploadImage, deleteImage } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Загрузка изображения (только для admin и manager)
router.post(
  '/image',
  authenticateToken,
  checkRole(['admin', 'manager']),
  upload.single('image'),
  uploadImage
);

// Удаление изображения (только для admin и manager)
router.delete(
  '/image/:filename',
  authenticateToken,
  checkRole(['admin', 'manager']),
  deleteImage
);

export default router;
