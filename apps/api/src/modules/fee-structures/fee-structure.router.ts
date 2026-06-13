import { Router } from 'express';
import {
  FeeHeadSchema,
  FeeHeadUpdateSchema,
  FeeHeadQuerySchema,
  CreateFeeStructureSchema,
  UpdateFeeStructureSchema,
  FeeStructureQuerySchema,
  IdParamSchema,
} from '@sms/types';
import { authGuard, rbac } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as ctrl from './fee-structure.controller';

export const feeStructureRouter = Router();
feeStructureRouter.use(authGuard);

feeStructureRouter.get('/heads', validate(FeeHeadQuerySchema, 'query'), ctrl.listHeads);
feeStructureRouter.post('/heads', rbac('admin'), validate(FeeHeadSchema), ctrl.createHead);
feeStructureRouter.patch(
  '/heads/:id',
  rbac('admin'),
  validate(IdParamSchema, 'params'),
  validate(FeeHeadUpdateSchema),
  ctrl.updateHead,
);

feeStructureRouter.get('/', validate(FeeStructureQuerySchema, 'query'), ctrl.list);
feeStructureRouter.get('/:id', validate(IdParamSchema, 'params'), ctrl.getById);
feeStructureRouter.post('/', rbac('admin'), validate(CreateFeeStructureSchema), ctrl.create);
feeStructureRouter.patch(
  '/:id',
  rbac('admin'),
  validate(IdParamSchema, 'params'),
  validate(UpdateFeeStructureSchema),
  ctrl.update,
);
feeStructureRouter.delete('/:id', rbac('admin'), validate(IdParamSchema, 'params'), ctrl.remove);
