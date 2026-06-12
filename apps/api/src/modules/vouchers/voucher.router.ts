import { Router } from 'express';
import {
  CreateVoucherSchema,
  BatchVoucherSchema,
  UpdateVoucherStatusSchema,
  VoucherQuerySchema,
  IdParamSchema,
} from '@sms/types';
import { authGuard, rbac } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as ctrl from './voucher.controller';

export const voucherRouter = Router();
voucherRouter.use(authGuard);

voucherRouter.get('/', validate(VoucherQuerySchema, 'query'), ctrl.list);
voucherRouter.get('/:id', validate(IdParamSchema, 'params'), ctrl.getById);
voucherRouter.post('/', rbac('admin', 'staff'), validate(CreateVoucherSchema), ctrl.create);
voucherRouter.post('/batch', rbac('admin'), validate(BatchVoucherSchema), ctrl.createBatch);
voucherRouter.patch(
  '/:id/status',
  rbac('admin', 'staff'),
  validate(IdParamSchema, 'params'),
  validate(UpdateVoucherStatusSchema),
  ctrl.updateStatus,
);
