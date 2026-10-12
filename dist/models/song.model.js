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
const mongoose_slug_updater_1 = __importDefault(require("mongoose-slug-updater"));
mongoose_1.default.plugin(mongoose_slug_updater_1.default);
const songSchema = new mongoose_1.default.Schema({
    title: String,
    avatar: String,
    description: String,
    singerId: {
        type: String,
        ref: "Singer"
    },
    topicId: String,
    albumId: { type: String, default: "", index: true },
    trackNumber: { type: Number, default: 0, min: 0 },
    like: { type: Number, default: 0, min: 0 },
    listen: {
        type: Number,
        default: 0,
    },
    lyrics: String,
    audio: String,
    status: String,
    slug: {
        type: String,
        slug: "title",
        unique: true
    },
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
        m.scheduleMeiliRefresh("song:" + id, () => m.refreshSong(id));
    }).catch(error => console.error("[Meili hook song]", error));
}
songSchema.post("save", function (doc) { queueIndex(String(doc._id)); });
songSchema.post("findOneAndUpdate", function (doc) { if (doc === null || doc === void 0 ? void 0 : doc._id)
    queueIndex(String(doc._id)); });
songSchema.post("findOneAndDelete", function (doc) { if (doc === null || doc === void 0 ? void 0 : doc._id)
    queueIndex(String(doc._id)); });
songSchema.post("updateOne", function () {
    const query = this;
    const filter = query.getFilter();
    if ((filter === null || filter === void 0 ? void 0 : filter._id) && (typeof filter._id === "string" || filter._id instanceof mongoose_1.default.Types.ObjectId)) {
        queueIndex(String(filter._id));
        return;
    }
    void query.model.findOne(filter).select("_id").lean()
        .then((doc) => { if (doc === null || doc === void 0 ? void 0 : doc._id)
        queueIndex(String(doc._id)); })
        .catch((error) => console.error("[Meili hook song updateOne]", error));
});
songSchema.post("deleteOne", function () {
    var _a, _b;
    const filter = (_b = (_a = this).getFilter) === null || _b === void 0 ? void 0 : _b.call(_a);
    if (filter === null || filter === void 0 ? void 0 : filter._id)
        queueIndex(String(filter._id));
});
const Song = mongoose_1.default.model("Song", songSchema, "songs");
exports.default = Song;
