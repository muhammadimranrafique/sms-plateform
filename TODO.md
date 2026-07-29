# TODO

## Goal: Fix 404 for GET /dashboard/vouchers/by-voucher-no/:voucherNo/print

- [ ] Add missing API route: `GET /api/v1/vouchers/by-voucher-no/:voucherNo/print` in `apps/api/src/modules/vouchers/voucher.router.ts`.
- [ ] Implement controller handler `printByVoucherNo` in `apps/api/src/modules/vouchers/voucher.controller.ts`.
- [ ] Implement service method `getVoucherByVoucherNo` in `apps/api/src/modules/vouchers/voucher.service.ts`.
- [ ] Ensure route order doesn’t conflict with `/:id`.
- [ ] Run typecheck/lint/tests for `apps/api`.
