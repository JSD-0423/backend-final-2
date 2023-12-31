import { Cart } from "../models/Cart";
import { Product } from "../models/Product";
import { getCartProducts } from "./cart-product";
import getConnection from "../database/config";
import { CART_STATUS } from "../enums/status-enums";

export const getCart = async (user_id: string) => {
  const [cart] = await Cart.findOrCreate<Cart>({
    where: { status: CART_STATUS.IN_PROGRESS, user_id: user_id },
  });
  return cart;
};

export const getActiveCartById = async (cartId: string) => {
  return await Cart.findOne({
    where: { id: cartId, status: CART_STATUS.IN_PROGRESS },
  });
};

export const updateTotalPrice = async (cart: Cart) => {
  const connection = getConnection();
  const result: any = await getCartProducts({
    attributes: [
      [
        connection.fn(
          "sum",
          connection.literal(
            "CASE WHEN products.discount_type = 'percentage' THEN (quantity * products.price) * (100 - products.discount) / 100 WHEN products.discount_type = 'fixed' THEN (quantity * products.price) - products.discount * quantity END"
          )
        ),
        "totalPrice",
      ],
    ],
    include: [
      {
        model: Product,
        attributes: [],
      },
    ],

    where: {
      cart_id: cart.id,
    },
    raw: true,
  });

  cart.total_cost = 0;
  if (result.length > 0) {
    const totalPrice = result[0].totalPrice ?? 0;
    const cartDiscount: number = cart.discount / 100;
    const tax = cart.tax;
    cart.total_cost = totalPrice - totalPrice * cartDiscount + tax;
  }
  await cart.save();
};
