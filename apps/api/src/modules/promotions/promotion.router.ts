import { Router } from 'express';
import {
  PromotionSchema,
  PromotionQuerySchema,
  SinglePromotionSchema,
  BulkPromotionPreviewSchema,
  BulkPromotionExecuteSchema,
  CreatePromotionRuleSchema,
  UpdatePromotionRuleSchema,
  PromotionRuleQuerySchema,
  IdParamSchema,
} from '@sms/types';
import { authGuard, rbac } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as ctrl from './promotion.controller';

export const promotionRouter = Router();
promotionRouter.use(authGuard);

promotionRouter.get('/', validate(PromotionQuerySchema, 'query'), ctrl.list);
promotionRouter.post('/', rbac('admin'), validate(PromotionSchema), ctrl.promote);

promotionRouter.post('/single', rbac('admin'), validate(SinglePromotionSchema), ctrl.promoteSingle);

promotionRouter.post('/bulk/preview', rbac('admin'), validate(BulkPromotionPreviewSchema), ctrl.previewBulk);
promotionRouter.post('/bulk/execute', rbac('admin'), validate(BulkPromotionExecuteSchema), ctrl.executeBulk);

promotionRouter.post('/:batchId/rollback', rbac('admin'), ctrl.rollback);

promotionRouter.get('/rules', validate(PromotionRuleQuerySchema, 'query'), ctrl.listRules);
promotionRouter.post('/rules', rbac('admin'), validate(CreatePromotionRuleSchema), ctrl.createRule);
promotionRouter.patch(
  '/rules/:id',
  rbac('admin'),
  validate(IdParamSchema, 'params'),
  validate(UpdatePromotionRuleSchema),
  ctrl.updateRule,
);
