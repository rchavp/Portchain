import {
  Vessel,
  Port,
  Call,
  LogEntry,
  Delays,
  LogDelay,
  ProcessedCall,
  MapOfPorts,
  MapOfVessels
} from './types'

console.log('Starting app ...')

const toHours = (millis: number): number => millis / 3600000
const toDays = (millis: number): number => millis / (3600000*24)

const dateDiff = (d1: string, d2: string) =>
  new Date(d1).valueOf() - new Date(d2).valueOf()

const getPercentile = (samples: Array<number>, perc) => {
  const sorted = samples.sort((a, b) => a - b)
  const index = Math.ceil(sorted.length * (perc/100)) - 1 // Zero based
  return sorted[(index < sorted.length ? index : sorted.length - 1)]
}

const getVessels = (): Array<Vessel> => require('../test/VESSELS.json')

const getPortCalls = (vessel: Vessel): Array<Call> =>
  require(`../test/${vessel.imo}.json`).portCalls.map(c => ({...c, vessel}))

const getDelays2714 = (delays: Array<LogDelay>) => {
  const categorizedDelaysSorted = delays.map(d => {
    const delay = Math.abs(dateDiff(d.actualArrival, d.forecastedArrival))
    const forecastSpan = toDays(dateDiff(d.actualArrival, d.forecastDate))
    const delayCategory = forecastSpan < 2
      ? 'ignore'
      : forecastSpan < 7
      ? '2Day'
      : forecastSpan < 14
      ? '7Day'
      : '14Day'
    return { forecastSpan, delayCategory, delay }
  }).sort((c1, c2) => c2.forecastSpan - c1.forecastSpan)
  const latestDelays: Delays = categorizedDelaysSorted
  .reduce((acc, c) => (c.delayCategory === 'ignore'
    ? acc
    : c.delayCategory === '14Day'
    ? { '2Day': c.delay, '7Day': c.delay, '14Day': c.delay } 
    : c.delayCategory === '7Day'
    ? { '2Day': c.delay, '7Day': c.delay, '14Day': acc['14Day'], } 
    : { '2Day': c.delay, '7Day': acc['7Day'], '14Day': acc['14Day'] }) 
  , { '2Day': -1, '7Day': -1, '14Day': -1 })

  latestDelays['7Day'] = latestDelays['7Day'] === -1
    ? latestDelays['14Day']
    : latestDelays['7Day']
  latestDelays['2Day'] = latestDelays['2Day'] === -1
    ? latestDelays['7Day']
    : latestDelays['2Day']

  return latestDelays
}

const processPortCalls = (portCalls: Array<Call>): Array<ProcessedCall> => 
  portCalls.filter(call => !call.isOmitted)
  .map(call => {
    /* console.dir(call) */
    const duration = dateDiff(call.departure, call.arrival)
    const delays: Array<LogDelay> = call.logEntries
    .filter(log => log.updatedField === 'arrival' && (log.isOmitted === null || !log.isOmitted))
    .map(log => ({
      forecastedArrival: log.arrival!,
      actualArrival: call.arrival,
      forecastDate: log.createdDate
    }))

    return {
      ...call,
      duration,
      delays: getDelays2714(delays)
    } as ProcessedCall
  })

///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

const main = () => {

  // Get dataset for vessels
  const vessels: Array<Vessel> = getVessels()

  // Get dataset for all portcalls bt iterating over all vessels
  const allPortCalls = vessels.reduce((acc: Array<Call>, vessel: Vessel) =>
    [...acc, ...getPortCalls(vessel)]
  ,[])

// Transform (process) all portcalls to enhace them with the data for 2,7,14 days delays and durations
  const processedCalls: Array<ProcessedCall> = processPortCalls(allPortCalls)

  // Get aggregated Port data by aggregating the portcalls
  // This will return an array of all Ports with their aggregated data for totalVisits
  // and durations flattened as an array property
  const portsAggrAndSorted = Object.values(
    processedCalls.reduce((ports: MapOfPorts, call: ProcessedCall) => {
      const port = ports[call.port.id] || { ...call.port, totalVisits: 0, durations: [] }
      return {
        ...ports,
        [call.port.id]: {
          ...port,
          totalVisits: port.totalVisits + 1,
          durations: [...port.durations, call.duration],
        }
      } as MapOfPorts
  }, {}))
  .sort((port1: Port, port2: Port) => port1.totalVisits - port2.totalVisits)

  const portsWithPercentiles = portsAggrAndSorted.map((port: Port) =>
    ({
      ...port,
      percentiles: [
        getPercentile(port.durations, 5),
        getPercentile(port.durations, 20),
        getPercentile(port.durations, 50),
        getPercentile(port.durations, 75),
        getPercentile(port.durations, 90),
      ],
    })
  )

  // Get aggregated data for vessels by aggregating the portcalls
  // this will return an array of Vessels with their data for delays
  // as a flattenned array property of sets of 2,7,14 days delays (per each call)
  const vesselsAggregated = Object.values(
    processedCalls.reduce((vessels: MapOfVessels, call: ProcessedCall) => {
      const vessel = vessels[call.vessel.imo] || { ...call.vessel, allDelays: [] }
      return {
        ...vessels,
        [call.vessel.imo]: {
          ...vessel,
          allDelays: [ ...vessel.allDelays, call.delays ],
        }
      } as MapOfVessels
  }, {}))

  const vesselsWithPercentiles = vesselsAggregated.map((vessel: Vessel) => {
    const allDelays2Day = vessel.allDelays.map((d: Delays) => d['2Day'])
    const allDelays7Day = vessel.allDelays.map((d: Delays) => d['7Day'])
    const allDelays14Day = vessel.allDelays.map((d: Delays) => d['14Day'])
    return {
      ...vessel,
      percentiles2Day: [
        getPercentile(allDelays2Day, 5),
        getPercentile(allDelays2Day, 50),
        getPercentile(allDelays2Day, 80),
      ],
      percentiles7Day: [
        getPercentile(allDelays7Day, 5),
        getPercentile(allDelays7Day, 50),
        getPercentile(allDelays7Day, 80),
      ],
      percentiles14Day: [
        getPercentile(allDelays14Day, 5),
        getPercentile(allDelays14Day, 50),
        getPercentile(allDelays14Day, 80),
      ],
    } as Vessel
  })

  /* console.dir(portsWithPercentiles) */
  /* console.dir(vesselsWithPercentiles) */

  console.log('\n\n//////////////////////////////// PORTS ///////////////////////////////')
  portsWithPercentiles.forEach(p => {
    console.log(`Port: ${p.name} (${p.id}). Visits: ${p.totalVisits}`)
    console.log(`Duration Percentiles:`, p.percentiles.map(d => `${toHours(d).toFixed(2)} hours`))
    console.log(`------------------------------------------------------------------------`)
  })

  console.log('\n\n//////////////////////////////// VESSELS ///////////////////////////////')
  vesselsWithPercentiles.forEach(v => {
    console.log(`Vessel: ${v.name} (${v.imo})`)
    console.log(`2Day delays Percentiles:`, v.percentiles2Day.map(d => `${toHours(d).toFixed(2)} hours`))
    console.log(`7Day delays Percentiles:`, v.percentiles7Day.map(d => `${toHours(d).toFixed(2)} hours`))
    console.log(`14Day delays Percentiles:`, v.percentiles14Day.map(d => `${toHours(d).toFixed(2)} hours`))
    console.log(`------------------------------------------------------------------------`)
  })

}

main()

