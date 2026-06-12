import { Router } from 'express';
import { CreateSessionSchema, UpdateSessionSchema, IdParamSchema } from '@sms/types';
import { authGuard, rbac } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as ctrl from './session.controller';

export const sessionRouter = Router();
sessionRouter.use(authGuard);

sessionRouter.get('/', ctrl.list);
sessionRouter.get('/current', ctrl.current);
sessionRouter.post('/', rbac('admin'), validate(CreateSessionSchema), ctrl.create);
sessionRouter.patch(
  '/:id',
  rbac('admin'),
  validate(IdParamSchema, 'params'),
  validate(UpdateSessionSchema),
  ctrl.update,
);
