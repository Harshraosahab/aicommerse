import { Router } from 'express';
import { orderController } from '../../../controllers/order.controller.js';
import { authenticate } from '../../../middleware/auth.js';

const router = Router();

// All order operations require an authenticated user session
router.use(authenticate);

router.post('/', (req, res, next) => orderController.initiateOrder(req, res, next));
router.get('/', (req, res, next) => orderController.getMyOrders(req, res, next));
router.get('/:orderId', (req, res, next) => orderController.getOrderDetails(req, res, next));
router.post('/:orderId/cancel', (req, res, next) => orderController.cancelOrder(req, res, next));
router.post('/:orderId/return', (req, res, next) => orderController.requestReturn(req, res, next));
router.get('/:orderId/invoice', (req, res, next) => orderController.getInvoice(req, res, next));

export default router;