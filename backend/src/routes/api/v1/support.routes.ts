import { Router } from 'express';
import { SupportController } from '../../../controllers/support.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import {
  createTicketSchema,
  getTicketsQuerySchema,
  ticketParamSchema,
  addReplySchema,
} from '../../../validators/support.validator.js';

const router = Router();

// All customer support routes require authentication
router.use(authenticate);

router.post(
  '/',
  validate(createTicketSchema),
  SupportController.createTicket
);

router.get(
  '/',
  validate(getTicketsQuerySchema),
  SupportController.getMyTickets
);

router.get(
  '/:ticketId',
  validate(ticketParamSchema),
  SupportController.getTicketById
);

router.post(
  '/:ticketId/reply',
  validate(addReplySchema),
  SupportController.addReply
);

router.patch(
  '/:ticketId/close',
  validate(ticketParamSchema),
  SupportController.closeTicket
);

export default router;
