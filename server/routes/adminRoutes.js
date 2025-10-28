import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkRole, checkPermission } from '../middleware/roleMiddleware.js';
import * as productController from '../controllers/admin/productController.js';
import * as analyticsController from '../controllers/admin/analyticsController.js';
import * as reportController from '../controllers/admin/reportController.js';
import * as userController from '../controllers/admin/userController.js';
import * as dashboardController from '../controllers/admin/dashboardController.js';
import * as simpleDashboard from '../controllers/admin/simpleDashboard.js';
import * as exportController from '../controllers/admin/exportController.js';

const router = express.Router();

// Middleware для проверки доступа администратора или менеджера
router.use(authenticateToken);
router.use(checkRole(['admin', 'manager']));

// Маршруты для управления товарами (только для админа)
router.get('/products', checkPermission('products', 'read'), productController.getAllProducts);
router.post('/products', 
  checkRole(['admin']), 
  checkPermission('products', 'create'),
  [
    body('name').notEmpty().withMessage('Название товара обязательно'),
    body('slug').notEmpty().withMessage('Slug товара обязателен'),
    body('price').isNumeric().withMessage('Цена должна быть числом')
  ],
  productController.createProduct
);
router.put('/products/:id', 
  checkRole(['admin']), 
  checkPermission('products', 'update'),
  productController.updateProduct
);
router.delete('/products/:id', 
  checkRole(['admin']), 
  checkPermission('products', 'delete'),
  productController.deleteProduct
);
router.put('/products/:id/inventory', 
  checkPermission('products', 'update'),
  body('quantity').isInt({ min: 0 }).withMessage('Количество должно быть положительным числом'),
  productController.updateInventory
);

// Маршруты для аналитики (доступны админу и менеджеру)
router.get('/analytics/sales', checkPermission('analytics', 'read'), analyticsController.getSalesStatistics);
router.get('/analytics/categories', checkPermission('analytics', 'read'), analyticsController.getCategoryStatistics);
router.get('/analytics/users', checkPermission('analytics', 'read'), analyticsController.getUserStatistics);
router.get('/analytics/top-products', checkPermission('analytics', 'read'), analyticsController.getTopSellingProducts);
router.get('/analytics/order-statuses', checkPermission('analytics', 'read'), analyticsController.getOrderStatusStatistics);

// Маршруты для отчетов (доступны админу и менеджеру)
router.get('/reports/export/sales', checkPermission('analytics', 'read'), reportController.exportSalesStatisticsCSV);
router.get('/reports/export/products', checkPermission('analytics', 'read'), reportController.exportProductsCSV);
router.get('/reports/export/orders', checkPermission('analytics', 'read'), reportController.exportOrdersCSV);
router.get('/reports/export/customers', checkPermission('analytics', 'read'), reportController.exportCustomersCSV);

// Маршруты для управления пользователями (только для админа)
router.get('/users', checkRole(['admin']), userController.getAllUsers);
router.get('/users/:id', checkRole(['admin']), userController.getUserById);
router.put('/users/:id', checkRole(['admin']), userController.updateUser);
router.delete('/users/:id', checkRole(['admin']), userController.deleteUser);

// Маршруты для дашбордов
router.get('/dashboard/stats', simpleDashboard.getSimpleDashboardStats);
router.get('/dashboard/products', dashboardController.getProductsStats);
router.get('/dashboard/users', checkRole(['admin']), dashboardController.getUsersStats);
router.get('/dashboard/orders', dashboardController.getOrdersStats);

// Маршруты для экспорта
router.get('/export/products', exportController.exportProductsCSV);
router.get('/export/orders', exportController.exportOrdersCSV);
router.get('/export/dashboard', exportController.exportDashboardCSV);

export default router;
