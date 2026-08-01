import { Express } from 'express'
import {dashboardRouter} from './dashboard.route'
import { systemConfig } from '../../config/system'
import { topicRouter } from './topics.route';
import { songRouter } from './song.route';
import { uploadRouter } from './upload.route';

export const routeAdmin = (app: Express) => {
    const path = systemConfig.prefixAdmin;

    app.use(`/${path}/dashboard`, dashboardRouter)

    app.use(`/${path}/topics`, topicRouter)

    app.use(`/${path}/songs`, songRouter)

    app.use(`/${path}/upload`, uploadRouter)
}