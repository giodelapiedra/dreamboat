import { Router, type Router as ExpressRouter } from "express";

import { asyncHandler } from "../../common/async-handler";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as bookingsController from "./bookings.controller";
import {
  bookingParamsSchema,
  createBookingSchema,
} from "./bookings.schema";

const router: ExpressRouter = Router();

router.use(authenticate);
router.get("/", asyncHandler(bookingsController.getMine));
router.get(
  "/:id",
  validate(bookingParamsSchema),
  asyncHandler(bookingsController.getById),
);
router.post(
  "/",
  validate(createBookingSchema),
  asyncHandler(bookingsController.create),
);
router.patch(
  "/:id/cancel",
  validate(bookingParamsSchema),
  asyncHandler(bookingsController.cancel),
);

export default router;



