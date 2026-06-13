import { Router } from 'express';
import { authGuard } from '../../middleware/auth.middleware';
import * as ctrl from './report-v2.controller';

export const reportV2Router = Router();
reportV2Router.use(authGuard);

reportV2Router.get('/student-ledger/:studentId', ctrl.getStudentLedger);
reportV2Router.get('/defaulters', ctrl.getDefaulterList);
reportV2Router.get('/class-collection', ctrl.getClassCollectionSummary);
reportV2Router.get('/comparative', ctrl.getComparativeReport);
reportV2Router.get('/concessions', ctrl.getConcessionReport);
