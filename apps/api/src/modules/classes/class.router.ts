import { Router } from 'express';
import { CreateClassSchema, UpdateClassSchema, IdParamSchema } from '@sms/types';
import { authGuard, rbac } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as ctrl from './class.controller';

export const classRouter = Router();
classRouter.use(authGuard);

classRouter.get('/', ctrl.list);
classRouter.post('/', rbac('admin'), validate(CreateClassSchema), ctrl.create);
classRouter.patch(
  '/:id',
  rbac('admin'),
  validate(IdParamSchema, 'params'),
  validate(UpdateClassSchema),
  ctrl.update,
);
