import { Router } from 'express';
import { CreateFeePaymentSchema, FeePaymentQuerySchema } from '@sms/types';
import { authGuard, rbac } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as ctrl from './fee-payment.controller';

export const feePaymentRouter = Router();
feePaymentRouter.use(authGuard);

feePaymentRouter.get('/', validate(FeePaymentQuerySchema, 'query'), ctrl.list);
feePaymentRouter.post('/', rbac('admin', 'staff'), validate(CreateFeePaymentSchema), ctrl.create);
