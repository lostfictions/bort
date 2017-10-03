import * as express from 'express'
import * as path from 'path'

// Open a responder we can ping (via uptimerobot.com or similar) for status
// and serving static files
export function pingserver(port : number) : express.Express {
  const app = express()
  app.use(express.static(path.join(__dirname, '../../static')))

  app.get('/', (req, res) => {
    res.status(200).end()
  })
  app.listen(port)
  return app
}
