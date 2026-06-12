import { Router } from 'express';
import { authGuard } from '../../middleware/auth.middleware';
import * as ctrl from './report.controller';

export const reportRouter = Router();
reportRouter.use(authGuard);

reportRouter.get('/dashboard', ctrl.dashboard);
reportRouter.get('/fee-collection', ctrl.feeCollection);
