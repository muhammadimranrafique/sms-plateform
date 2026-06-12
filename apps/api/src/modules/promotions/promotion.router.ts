import { Router } from 'express';
import { PromotionSchema, PromotionQuerySchema } from '@sms/types';
import { authGuard, rbac } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as ctrl from './promotion.controller';

export const promotionRouter = Router();
promotionRouter.use(authGuard);

promotionRouter.get('/', validate(PromotionQuerySchema, 'query'), ctrl.list);
promotionRouter.post('/', rbac('admin'), validate(PromotionSchema), ctrl.promote);
