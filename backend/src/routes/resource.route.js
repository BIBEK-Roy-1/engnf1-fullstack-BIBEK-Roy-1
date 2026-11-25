import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { getResourcesController,  getResourceByIdController, createResourceController,updateResourceController,getResourceAvailabilityController } from "../controllers/resource.controller.js";

const router = express.Router();

router.get("/", authenticate, getResourcesController);
router.get( "/:id/availability",authenticate,getResourceAvailabilityController);
router.get("/:id", authenticate, getResourceByIdController);
router.post("/",authenticate,authorize("ADMIN"),createResourceController);
router.patch("/:id",authenticate,authorize("ADMIN"),updateResourceController);


export default router;