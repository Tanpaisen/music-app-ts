import { Express } from 'express'
import {dashboardRouter} from './dashboard.route'
import { systemConfig } from '../../config/system'
import { topicRouter } from './topics.route';
import { albumRouter } from "./album.route";
import { topicCategoryRouter } from './topic-categories.route';
import { songRouter } from './song.route';
import { uploadRouter } from './upload.route';
import { singerRouter } from './singer.route';
import { roleRouter } from './role.route';
import { accountRouter } from './account.route';
import { authRouter } from './auth.route';
import * as authMiddleware  from '../../middleware/admin/authentication.middleware'

export const routeAdmin = (app: Express) => {
    const path = systemConfig.prefixAdmin;

    app.use(`/${path}/dashboard`, authMiddleware.requireAuth, dashboardRouter)

    app.use(`/${path}/topics`, authMiddleware.requireAuth, topicRouter)

    app.use(`/${path}/topic-categories`, authMiddleware.requireAuth, topicCategoryRouter)

    app.use(`/${path}/albums`, authMiddleware.requireAuth, albumRouter)

    app.use(`/${path}/songs`, authMiddleware.requireAuth, songRouter)

    app.use(`/${path}/upload`, authMiddleware.requireAuth, uploadRouter)

    app.use(`/${path}/singers`, authMiddleware.requireAuth, singerRouter)

    app.use(`/${path}/accounts`, authMiddleware.requireAuth, accountRouter)

    app.use(`/${path}/roles`, authMiddleware.requireAuth, roleRouter)

    app.use(`/${path}/auth`, authRouter)
}