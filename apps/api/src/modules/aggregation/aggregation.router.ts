import { Router } from 'express';
import { authGuard, rbac } from '../../middleware/auth.middleware';
import * as aggregationController from './aggregation.controller';

export const aggregationRouter = Router();
aggregationRouter.use(authGuard);

aggregationRouter.get('/student/:studentId', aggregationController.getStudentSummary);
aggregationRouter.get('/class/:classId', aggregationController.getClassSummary);
aggregationRouter.get('/institution/kpi', aggregationController.getInstitutionKPI);
aggregationRouter.get('/daily-register', aggregationController.getDailyRegister);
aggregationRouter.get('/monthly-register', aggregationController.getMonthlyRegister);
aggregationRouter.get('/head-wise', aggregationController.getHeadWiseBreakdown);
aggregationRouter.post('/refresh', rbac('admin'), aggregationController.refreshAggregation);
