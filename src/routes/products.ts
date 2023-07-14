import { Router } from "express";
import {
  getBrandProducts,
  getCategoryProducts,
  getHandPicked,
  getNewArrivals,
  getProducts,
  getSearchProductsAndBrands,
} from "../controllers/products";

export const router = Router();
router.get(
  "/",
  getCategoryProducts,
  getBrandProducts,
  getSearchProductsAndBrands,
  getNewArrivals,
  getHandPicked,
  getProducts
);
