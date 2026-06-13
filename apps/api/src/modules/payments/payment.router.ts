import { Router } from 'express';
import {
  ReceivePaymentSchema,
  ReversePaymentSchema,
  PaymentQuerySchema,
} from '@sms/types';
import { authGuard, rbac } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as ctrl from './payment.controller';

export const paymentRouter = Router();
paymentRouter.use(authGuard);

paymentRouter.post(
  '/receive',
  rbac('admin', 'staff'),
  validate(ReceivePaymentSchema),
  ctrl.receive,
);

paymentRouter.get(
  '/student/:studentId',
  validate(PaymentQuerySchema, 'query'),
  ctrl.history,
);

paymentRouter.patch(
  '/:paymentId/reverse',
  rbac('admin'),
  validate(ReversePaymentSchema),
  ctrl.reverse,
);
