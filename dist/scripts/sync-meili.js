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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const meilisearch_service_1 = require("../services/meilisearch.service");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const uri = process.env.MongoDB;
        if (!uri)
            throw new Error("Missing MongoDB in .env");
        if (!process.env.MEILI_ADMIN_KEY)
            throw new Error("Missing MEILI_ADMIN_KEY in .env");
        yield mongoose_1.default.connect(uri);
        try {
            yield (0, meilisearch_service_1.syncAllToMeili)();
        }
        finally {
            yield mongoose_1.default.disconnect();
        }
    });
}
main().catch(error => { console.error("[Meili sync failed]", error); process.exitCode = 1; });
