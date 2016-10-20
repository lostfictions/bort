import * as express from 'express'

//Open a responder we can ping (via uptimerobot.com or similar) so the OpenShift app doesn't idle
export function pingserver(port : number, host : string) : express.Express {
  const app = express()

  app.get('/', (req, res) => {
    res.status(200).end()
  })
  app.listen(port, host)
  return app
}
