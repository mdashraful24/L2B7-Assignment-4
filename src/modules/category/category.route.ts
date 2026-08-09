import { Router } from "express";
import { categoryController } from "./category.controller";

const router = Router();


router.get("/", categoryController.allServiceCategories);

router.get("/all-public-category", categoryController.getAllPublicCategories);


export const categoryRoutes = router;