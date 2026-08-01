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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const database = __importStar(require("./config/database"));
const index_route_1 = require("./routes/client/index.route");
const meilisearch_service_1 = require("./services/meilisearch.service");
const index_route_2 = require("./routes/admin/index.route");
const path_1 = __importDefault(require("path"));
const system_1 = require("./config/system");
const body_parser_1 = __importDefault(require("body-parser"));
const method_override_1 = __importDefault(require("method-override"));
database.connect();
const app = (0, express_1.default)();
app.set('views', `${__dirname}/views`);
app.set('view engine', 'pug');
app.use(express_1.default.static(__dirname + '/public'));
app.use((0, method_override_1.default)('_method'));
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use('/tinymce', express_1.default.static(path_1.default.join(__dirname, 'node_modules', 'tinymce')));
app.locals.prefixAdmin = system_1.systemConfig.prefixAdmin;
(0, index_route_1.routeMain)(app);
(0, index_route_2.routeAdmin)(app);
const PORT = process.env.PORT || 3000;
(0, meilisearch_service_1.syncSongsToMeili)();
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
