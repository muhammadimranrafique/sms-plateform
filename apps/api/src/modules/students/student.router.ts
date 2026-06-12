import { Router } from 'express';
import {
  CreateStudentSchema,
  UpdateStudentSchema,
  StudentQuerySchema,
  IdParamSchema,
} from '@sms/types';
import { authGuard, rbac } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as ctrl from './student.controller';

export const studentRouter = Router();

studentRouter.use(authGuard);

studentRouter.get('/', validate(StudentQuerySchema, 'query'), ctrl.list);
studentRouter.get('/:id', validate(IdParamSchema, 'params'), ctrl.getById);
studentRouter.post('/', rbac('admin', 'staff'), validate(CreateStudentSchema), ctrl.create);
studentRouter.patch(
  '/:id',
  rbac('admin', 'staff'),
  validate(IdParamSchema, 'params'),
  validate(UpdateStudentSchema),
  ctrl.update,
);
studentRouter.delete('/:id', rbac('admin'), validate(IdParamSchema, 'params'), ctrl.remove);
