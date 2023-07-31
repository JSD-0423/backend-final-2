import { RequestHandler, Response, Request, NextFunction } from "express";
import { exec } from "child-process-promise";
export const getSeed: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const result = await exec("sequelize-cli db:seed:all");
    response.status(200).json({
      error: false,
      status: 200,
      data: {
        result: result.stdout,
      },
    });
  } catch (e) {
    next(e);
  }
};
