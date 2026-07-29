import { Request, Response, NextFunction } from "express";
import { uploadToCloudinary } from "../helpers/uploadToCloudinary";

export const uploadSingle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if(req["file"]) {
    const link = await uploadToCloudinary(req["file"].buffer);
    req.body[req["file"].fieldname] = link;
    next();
  } else {
    next();
  }
}

// Middleware for multiple field uploads
export const uploadFields = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  for (const key in req['files']) {
    req.body[key] = [];
    const array = req['files'][key];

    for (const item of array) {
      try {
        const result = await uploadToCloudinary(item.buffer);
        req.body[key].push(result);
      } catch (error) {
        console.error(error);
      }
    }
  }

  next();
};
