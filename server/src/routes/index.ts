import { Router, type Router as ExpressRouter } from "express";

import adminRoutes from "../modules/admin/admin.routes";
import authRoutes from "../modules/auth/auth.routes";
import bookingsRoutes from "../modules/bookings/bookings.routes";
import confirmationsRoutes from "../modules/form-system/confirmations.routes";
import submissionsRoutes from "../modules/form-system/submissions.routes";
import webhooksRoutes from "../modules/form-system/webhooks.routes";
import listingsRoutes from "../modules/listings/listings.routes";
import paymentsRoutes from "../modules/payments/payments.routes";
import reviewsRoutes from "../modules/reviews/reviews.routes";
import uploadRoutes from "../modules/upload/upload.routes";
import healthRoutes from "./health.routes";

const router: ExpressRouter = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/confirm", confirmationsRoutes);
router.use("/submissions", submissionsRoutes);
router.use("/webhooks", webhooksRoutes);
router.use("/listings", listingsRoutes);
router.use("/listings/:id/reviews", reviewsRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/upload", uploadRoutes);
router.use("/admin", adminRoutes);

export default router;
