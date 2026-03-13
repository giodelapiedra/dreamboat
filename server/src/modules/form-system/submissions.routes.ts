import { Router, type Router as ExpressRouter } from "express";

import { asyncHandler } from "../../common/async-handler";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as formSystemController from "./form-system.controller";
import { submissionIdParamsSchema } from "./form-system.schema";

const router: ExpressRouter = Router();

router.use(authenticate);
router.get("/", asyncHandler(formSystemController.getSubmissionSummaries));
router.get("/trips", asyncHandler(formSystemController.getTrips));
router.get("/export", asyncHandler(formSystemController.exportSubmissions));
router.get(
  "/:id",
  validate(submissionIdParamsSchema),
  asyncHandler(formSystemController.getSubmissionDetail),
);

export default router;
