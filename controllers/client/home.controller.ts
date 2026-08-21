import { Request, Response } from "express";
import { homeService } from "../../services/home.service";

//[GET] /dashboard
export const dashboard = async (req: Request, res: Response) => {
  try {
    const data = await homeService.getDashboardData();
    res.json({
      code: 200,
      message: "Thành công",
      data,
    });
  } catch (error) {
    console.error("[dashboard.controller] error:", error);
    res.status(500).json({
      code: 500,
      message: "Lỗi máy chủ khi lấy dữ liệu dashboard",
    });
  }
};
