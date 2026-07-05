import { Router } from "express";
import { technicianController } from "./tech.controller";

const router = Router();


router.get("/", technicianController.allTechnician);
router.get("/:id", technicianController.singleTechnician);


export const technicianRoutes = router;