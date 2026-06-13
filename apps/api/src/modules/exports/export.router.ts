import { Router } from 'express';
import { authGuard } from '../../middleware/auth.middleware';
import * as ctrl from './export.controller';

export const exportRouter = Router();
exportRouter.use(authGuard);

exportRouter.get('/defaulters', ctrl.exportDefaulters);
exportRouter.get('/collection-register', ctrl.exportCollectionRegister);
