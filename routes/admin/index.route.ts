import { Express } from 'express'
import {dashboardRouter} from './dashboard.route'
import { systemConfig } from '../../config/system'

export const routeAdmin = (app: Express) => {
    const path = systemConfig.prefixAdmin;

    app.use(`${path}/dashboard`, dashboardRouter)

}