import { Express } from 'express'
import { topicRouter } from './topic.route'
import { songRouter } from './song.route'
import { searchRouter } from './search.route'
import { homeRouter } from '../client/home.route'
import { clientAuthRouter } from './auth.route'
import { playlistRouter } from './playlist.route'
import { commentRouter } from './comment.route'

export const routeMain = (app: Express) => {
    app.use('/', homeRouter)

    app.use('/home', homeRouter)
    
    app.use('/topics', topicRouter)

    app.use('/songs', songRouter)

    app.use('/api/playlists', playlistRouter)

    app.use('/api/comments', commentRouter)

    app.use('/search', searchRouter)

    app.use('/api/auth', clientAuthRouter)

}