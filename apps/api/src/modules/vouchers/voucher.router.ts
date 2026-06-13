import { Router } from 'express';
import {
  CreateVoucherSchema,
  GenerateVoucherSchema,
  GenerateBatchVoucherSchema,
  GenerateAllMonthsVoucherSchema,
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
voucherRouter.post('/generate', rbac('admin', 'staff'), validate(GenerateVoucherSchema), ctrl.generateSingle);
voucherRouter.post('/generate/batch', rbac('admin'), validate(GenerateBatchVoucherSchema), ctrl.generateBatch);
voucherRouter.post('/generate/all-months', rbac('admin', 'staff'), validate(GenerateAllMonthsVoucherSchema), ctrl.generateAllMonths);

voucherRouter.patch(
  '/:id/status',
  rbac('admin', 'staff'),
  validate(IdParamSchema, 'params'),
  validate(UpdateVoucherStatusSchema),
  ctrl.updateStatus,
);
