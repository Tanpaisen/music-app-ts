"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const accountShema = new mongoose_1.default.Schema({
    fullname: String,
    email: String,
    password: String,
    token: {
        type: String,
        required: true,
    },
    phone: String,
    avatar: String,
    role_id: String,
    status: String,
    deleted: {
        type: Boolean,
        default: false,
    },
    deleteAt: Date,
}, {
    timestamps: true
});
const Account = mongoose_1.default.model('Account', accountShema, 'accounts');
exports.default = Account;
