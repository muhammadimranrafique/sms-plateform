import { Router } from 'express';
import { CreateClassSchema, UpdateClassSchema, ClassQuerySchema, IdParamSchema } from '@sms/types';
import { authGuard, rbac } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as ctrl from './class.controller';

export const classRouter = Router();
classRouter.use(authGuard);

classRouter.get('/', validate(ClassQuerySchema, 'query'), ctrl.list);
classRouter.get('/:id', validate(IdParamSchema, 'params'), ctrl.getById);
classRouter.post('/', rbac('admin'), validate(CreateClassSchema), ctrl.create);
classRouter.patch(
  '/:id',
  rbac('admin'),
  validate(IdParamSchema, 'params'),
  validate(UpdateClassSchema),
  ctrl.update,
);
classRouter.delete('/:id', rbac('admin'), validate(IdParamSchema, 'params'), ctrl.remove);
