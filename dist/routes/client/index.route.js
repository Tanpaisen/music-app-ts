"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeMain = void 0;
const topic_route_1 = require("./topic.route");
const song_route_1 = require("./song.route");
const search_route_1 = require("./search.route");
const home_route_1 = require("../client/home.route");
const auth_route_1 = require("./auth.route");
const playlist_route_1 = require("./playlist.route");
const routeMain = (app) => {
    app.use('/', home_route_1.homeRouter);
    app.use('/home', home_route_1.homeRouter);
    app.use('/topics', topic_route_1.topicRouter);
    app.use('/songs', song_route_1.songRouter);
    app.use('/api/playlists', playlist_route_1.playlistRouter);
    app.use('/search', search_route_1.searchRouter);
    app.use('/api/auth', auth_route_1.clientAuthRouter);
};
exports.routeMain = routeMain;
