import express from 'express'
import { Express, Request, Response } from "express"
import * as path from "path"
import { getAggregates } from './aggregateService'
import { printResultsToConsole } from './outputservice'

console.log('Starting app ...')

///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

const runAsCommandLine = async () => {
  const { portsFullProcessedData, vesselsFullProcessedData } = await getAggregates()

  if (!portsFullProcessedData || !vesselsFullProcessedData)
    return -1
   
  // Print the results
  printResultsToConsole(portsFullProcessedData, vesselsFullProcessedData)
  return 0
}

const runAsWebste = () => {
  console.log('Instructed to run as website\n')
  const app: Express = express();
  const port = process.env.PORT || 9876;

  app.use(express.static(path.resolve("./") + "/dist/frontend"));

  app.get("*", (req: Request, res: Response): void => {
    res.sendFile(path.resolve("./") + "/dist/frontend/index.html")
  })

  app.listen(port, function() {
    console.log(`Listening on port ${port}`)
  })
}

// For the purposes of this code challenge here is a simple way to
// showcase the test being ran vi command line or web
if (process.env.RUNAS && process.env.RUNAS === 'WEB')
{
  runAsWebste()
} else {
  runAsCommandLine()
    .then((exitCode: number) => {
      console.log('--------------------------------------------------')
      console.log('--------------------------------------------------')
      if (exitCode === -1)
        console.error(`Process ended with code ${exitCode}`)
      else
        console.log('Process ended successfully')
    })
}

