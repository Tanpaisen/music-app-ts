"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeMain = void 0;
const topic_route_1 = require("./topic.route");
const song_route_1 = require("./song.route");
const search_route_1 = require("./search.route");
const routeMain = (app) => {
    app.use('/topics', topic_route_1.topicRouter);
    app.use('/songs', song_route_1.songRouter);
    app.use('/search', search_route_1.searchRouter);
};
exports.routeMain = routeMain;
