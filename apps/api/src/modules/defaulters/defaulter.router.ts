import { Router } from 'express';
import { authGuard, rbac } from '../../middleware/auth.middleware';
import * as ctrl from './defaulter.controller';

export const defaulterRouter = Router();
defaulterRouter.use(authGuard);

defaulterRouter.get('/', ctrl.listAlerts);
defaulterRouter.post('/generate', rbac('admin'), ctrl.generateAlerts);
defaulterRouter.patch('/:alertId/resolve', rbac('admin', 'staff'), ctrl.resolveAlert);
defaulterRouter.patch('/:alertId/dismiss', rbac('admin'), ctrl.dismissAlert);
