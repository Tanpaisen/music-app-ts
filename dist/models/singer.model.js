"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const singerSchema = new mongoose_1.default.Schema({
    fullName: String,
    avatar: String,
    status: String,
    slug: String,
    deleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: Date,
}, {
    timestamps: true,
});
function queueIndex(id) {
    Promise.resolve().then(() => __importStar(require("../services/meilisearch.service"))).then(m => {
        m.scheduleMeiliRefresh("singer:" + id, () => m.refreshArtist(id));
    }).catch(error => console.error("[Meili hook singer]", error));
}
singerSchema.post("save", function (doc) { queueIndex(String(doc._id)); });
singerSchema.post("findOneAndUpdate", function (doc) { if (doc === null || doc === void 0 ? void 0 : doc._id)
    queueIndex(String(doc._id)); });
singerSchema.post("findOneAndDelete", function (doc) { if (doc === null || doc === void 0 ? void 0 : doc._id)
    queueIndex(String(doc._id)); });
singerSchema.post("updateOne", function () {
    const query = this;
    const filter = query.getFilter();
    if ((filter === null || filter === void 0 ? void 0 : filter._id) && (typeof filter._id === "string" || filter._id instanceof mongoose_1.default.Types.ObjectId)) {
        queueIndex(String(filter._id));
        return;
    }
    void query.model.findOne(filter).select("_id").lean()
        .then((doc) => { if (doc === null || doc === void 0 ? void 0 : doc._id)
        queueIndex(String(doc._id)); })
        .catch((error) => console.error("[Meili hook singer updateOne]", error));
});
singerSchema.post("deleteOne", function () {
    var _a, _b;
    const filter = (_b = (_a = this).getFilter) === null || _b === void 0 ? void 0 : _b.call(_a);
    if (filter === null || filter === void 0 ? void 0 : filter._id)
        queueIndex(String(filter._id));
});
const Singer = mongoose_1.default.model("Singer", singerSchema, "singers");
exports.default = Singer;
