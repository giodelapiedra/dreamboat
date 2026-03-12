import { Router, type Router as ExpressRouter } from "express";

import { asyncHandler } from "../../common/async-handler";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as listingsController from "./listings.controller";
import {
  availabilityQuerySchema,
  createListingSchema,
  listingParamsSchema,
  listingQuerySchema,
  updateListingSchema,
} from "./listings.schema";

const router: ExpressRouter = Router();

router.get("/", validate(listingQuerySchema), asyncHandler(listingsController.getAll));
router.get(
  "/:id",
  validate(listingParamsSchema),
  asyncHandler(listingsController.getById),
);
router.get(
  "/:id/availability",
  validate(availabilityQuerySchema),
  asyncHandler(listingsController.getAvailability),
);
router.post(
  "/",
  authenticate,
  authorize("HOST", "ADMIN"),
  validate(createListingSchema),
  asyncHandler(listingsController.create),
);
router.patch(
  "/:id",
  authenticate,
  authorize("HOST", "ADMIN"),
  validate(updateListingSchema),
  asyncHandler(listingsController.update),
);
router.delete(
  "/:id",
  authenticate,
  authorize("HOST", "ADMIN"),
  validate(listingParamsSchema),
  asyncHandler(listingsController.remove),
);

export default router;


