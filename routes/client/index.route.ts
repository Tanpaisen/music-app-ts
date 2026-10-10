import { Express } from 'express'
import { topicRouter } from './topic.route'
import { songRouter } from './song.route'
import { searchRouter } from './search.route'
import { homeRouter } from '../client/home.route'
import { clientAuthRouter } from './auth.route'

export const routeMain = (app: Express) => {
    app.use('/', homeRouter)

    app.use('/home', homeRouter)
    
    app.use('/topics', topicRouter)

    app.use('/songs', songRouter)

    app.use('/search', searchRouter)

    app.use('/api/auth', clientAuthRouter)

}