"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.singerRepository = void 0;
const singer_model_1 = __importDefault(require("../models/singer.model"));
exports.singerRepository = {
    findByIds(ids) {
        if (ids.length === 0)
            return Promise.resolve([]);
        return singer_model_1.default.find({ _id: { $in: ids } }).select("fullName slug").lean();
    },
};
