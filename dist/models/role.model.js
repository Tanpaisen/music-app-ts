"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const roleSchema = new mongoose_1.default.Schema({
    title: String,
    description: {
        type: String,
        default: ""
    },
    permissions: Array,
    createdBy: {
        user_id: String,
        createdAt: {
            type: Date,
            default: Date.now,
        }
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    deleteAt: Date,
}, {
    timestamps: true
});
const Role = mongoose_1.default.model('Role', roleSchema, 'roles');
exports.default = Role;
