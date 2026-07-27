import { Express } from 'express'
import { topicRouter } from './topic.route'
import { songRouter } from './song.route'
import { searchRouter } from './search.route'

export const routeMain = (app: Express) => {

    app.use('/topics', topicRouter)

    app.use('/songs', songRouter)

    app.use('/search', searchRouter)

}