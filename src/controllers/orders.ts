import { NextFunction, Request, RequestHandler, Response } from "express";
import { User } from "../models/User";
import { Order } from "../models/Order";
import { GeneralError } from "../errors/general-error";
import { postOrdersValidator } from "../validators/post-orders-validator";
import * as cartServices from "../services/cart";
import * as orderServices from "../services/order";
import * as cartProductServices from "../services/cart-product";
import * as addressServices from "../services/address";
import { CART_STATUS, ORDER_STATUS } from "../enums/status-enums";
import { Address } from "../models/Address";
import exp from "constants";

export const postOrders: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    postOrdersValidator(request.body);
    const { transactionId, cartId, addressId } = request.body;
    const user = request.user as User;
    if (!user) return next();
    const hasAddress = await user.$has("address", addressId);
    if (!hasAddress)
      return next(new GeneralError("There is now address with this ID", 404));
    await checkCart(cartId);
    const order = await user.$create("order", {
      email: user.email,
      status: ORDER_STATUS.ACTIVE,
      cart_id: cartId,
      transaction_id: transactionId,
      address_id: addressId,
    });

    response.status(201).json({
      error: false,
      status: 201,
      data: {
        message: "Order created successfully",
        order: order,
      },
    });
  } catch (e) {
    next(e);
  }
};

export const postOrderWithoutUser: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { transactionId, cartId, addressId, email } = request.body;
    if (!email)
      return next(
        new GeneralError("Email address can not be null or login please", 422)
      );
    const address = await addressServices.getAddressById(addressId);
    if (!address)
      return next(new GeneralError("There is no address with this ID", 404));
    await checkCart(cartId);
    const order = await orderServices.createOrder({
      email: email,
      status: ORDER_STATUS.ACTIVE,
      user_id: null,
      cart_id: cartId,
      transaction_id: transactionId,
      address_id: addressId,
    });
    response.status(201).json({
      error: false,
      status: 201,
      data: {
        message: "Order created successfully",
        order: order,
      },
    });
  } catch (e) {
    next(e);
  }
};

export const getOrders: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const user: User = request.user as User;
    const orders = await user.$get("orders", { include: [Address] });
    response.status(200).json({
      error: false,
      status: 200,
      data: {
        orders: orders,
      },
    });
  } catch (e) {
    next(e);
  }
};

export const getOrderById: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const user: User = request.user as User;
    const { id } = request.params;
    const order: Order = (await user.$get("orders", { where: { id: id } }))[0];
    if (!order)
      return response.status(422).json({
        error: true,
        status: 422,
        data: {
          message: "there is no order with this ID",
        },
      });

    const cart = await order.$get("cart");
    const products = await cart?.$get("products");
    response.status(200).json({
      error: false,
      status: 200,
      data: {
        products: products,
      },
    });
  } catch (e) {
    next(e);
  }
};

const checkCart = async (cartId: string) => {
  const cart = await cartServices.getActiveCartById(cartId);
  if (!cart) throw new GeneralError("Cart does not exist", 404);
  const productsInCart = await cartProductServices.getCartProducts({
    where: { cart_id: cartId },
  });
  if (productsInCart.length < 1)
    throw new GeneralError("Your cart is Empty", 422);
  cart.status = CART_STATUS.MOVE_TO_ORDERS;
  await cart.save();
};
