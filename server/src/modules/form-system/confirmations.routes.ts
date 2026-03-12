import { Router, type Router as ExpressRouter } from "express";

import { asyncHandler } from "../../common/async-handler";
import { validate } from "../../middleware/validate";
import * as formSystemController from "./form-system.controller";
import { confirmationTokenParamsSchema, submitConfirmationSchema } from "./form-system.schema";

const router: ExpressRouter = Router();

router.get(
  "/:token",
  validate(confirmationTokenParamsSchema),
  asyncHandler(formSystemController.getConfirmationPayload),
);
router.post(
  "/:token",
  validate(submitConfirmationSchema),
  asyncHandler(formSystemController.submitConfirmation),
);

export default router;
