import {Router} from "express";
import {getSeed} from "../controllers/utils";

export const router = Router();
router.get("/seed",getSeed);