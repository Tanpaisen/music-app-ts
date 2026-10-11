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
const playlistSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    songIds: { type: [String], default: [] },
}, { timestamps: true, collection: "playlists" });
playlistSchema.index({ userId: 1, updatedAt: -1 });
function queueIndex(id) {
    Promise.resolve().then(() => __importStar(require("../services/meilisearch.service"))).then(m => {
        m.scheduleMeiliRefresh("playlist:" + id, () => m.refreshPlaylist(id));
    }).catch(error => console.error("[Meili hook playlist]", error));
}
playlistSchema.post("save", function (doc) { queueIndex(String(doc._id)); });
playlistSchema.post("findOneAndUpdate", function (doc) { if (doc === null || doc === void 0 ? void 0 : doc._id)
    queueIndex(String(doc._id)); });
playlistSchema.post("findOneAndDelete", function (doc) { if (doc === null || doc === void 0 ? void 0 : doc._id)
    queueIndex(String(doc._id)); });
playlistSchema.post("updateOne", function () {
    const query = this;
    const filter = query.getFilter();
    if ((filter === null || filter === void 0 ? void 0 : filter._id) && (typeof filter._id === "string" || filter._id instanceof mongoose_1.default.Types.ObjectId)) {
        queueIndex(String(filter._id));
        return;
    }
    void query.model.findOne(filter).select("_id").lean()
        .then((doc) => { if (doc === null || doc === void 0 ? void 0 : doc._id)
        queueIndex(String(doc._id)); })
        .catch((error) => console.error("[Meili hook playlist updateOne]", error));
});
playlistSchema.post("deleteOne", function () {
    var _a, _b;
    const filter = (_b = (_a = this).getFilter) === null || _b === void 0 ? void 0 : _b.call(_a);
    if (filter === null || filter === void 0 ? void 0 : filter._id)
        queueIndex(String(filter._id));
});
const Playlist = mongoose_1.default.model("Playlist", playlistSchema, "playlists");
exports.default = Playlist;
