"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboard = void 0;
const home_service_1 = require("../../services/home.service");
const dashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield home_service_1.homeService.getDashboardData();
        res.json({
            code: 200,
            message: "Thành công",
            data,
        });
    }
    catch (error) {
        console.error("[dashboard.controller] error:", error);
        res.status(500).json({
            code: 500,
            message: "Lỗi máy chủ khi lấy dữ liệu dashboard",
        });
    }
});
exports.dashboard = dashboard;
