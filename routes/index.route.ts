import { Express } from 'express'
import { topicRouter } from './topic.route'
export const routeMain = (app: Express) => {

    app.use('/topics', topicRouter)
}