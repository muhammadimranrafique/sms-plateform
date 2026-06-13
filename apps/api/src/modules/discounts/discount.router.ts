import { Router } from 'express';
import {
  CreateDiscountSchema,
  UpdateDiscountSchema,
  DiscountQuerySchema,
  IdParamSchema,
} from '@sms/types';
import { authGuard, rbac } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as ctrl from './discount.controller';

export const discountRouter = Router();
discountRouter.use(authGuard);

discountRouter.get('/', validate(DiscountQuerySchema, 'query'), ctrl.list);
discountRouter.get('/:id', validate(IdParamSchema, 'params'), ctrl.getById);
discountRouter.post('/', rbac('admin'), validate(CreateDiscountSchema), ctrl.create);
discountRouter.patch(
  '/:id',
  rbac('admin'),
  validate(IdParamSchema, 'params'),
  validate(UpdateDiscountSchema),
  ctrl.update,
);
discountRouter.delete('/:id', rbac('admin'), validate(IdParamSchema, 'params'), ctrl.remove);
