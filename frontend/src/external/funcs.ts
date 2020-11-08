import axios from 'axios'
import {
  Vessel,
  Call,
  Delays,
  LogDelay,
  ProcessedCall,
} from './types'
import { VesselApiError } from './customErrors'

const vesselsApi  = 'https://import-coding-challenge-api.portchain.com/api/v2/vessels'
const portCallApi = 'https://import-coding-challenge-api.portchain.com/api/v2/schedule'

const getVessels = async (): Promise<Array<Vessel>> =>
  axios.get(vesselsApi).then(res => res.data).catch(ex => {throw new VesselApiError(ex)})

const getPortCalls = (vessel: Vessel): Promise<Array<Call>> =>
  axios.get(`${portCallApi}/${vessel.imo}`).then(res => {
    return res.data.portCalls
  }
)

const toHours = (millis: number): number => millis / 3600000

const toDays = (millis: number): number => millis / (3600000*24)

const dateDiff = (d1: string, d2: string) =>
  new Date(d1).valueOf() - new Date(d2).valueOf()

const getPercentile = (perc: number, samples: Array<number>) => {
  const sorted = samples.sort((a, b) => a - b)
  const index = Math.ceil(sorted.length * (perc/100)) - 1 // Zero based
  return sorted[(index < sorted.length ? index : sorted.length - 1)]
}

  const curry = (f: any, ip = []) => (
    (...np: any) => { 
      const curried = (p: any) => 
        p.length === f.length ? f(...p) : curry(f, p)
      return curried([...ip, ...np])
    }
  )

  const compose = (...funcs: any) =>
    (initialArg: any) => funcs.reduceRight((acc: any, func: any) => func(acc), initialArg)

const percentile_05 = curry(getPercentile)(5)
const percentile_20 = curry(getPercentile)(20)
const percentile_50 = curry(getPercentile)(50)
const percentile_75 = curry(getPercentile)(75)
const percentile_80 = curry(getPercentile)(80)
const percentile_90 = curry(getPercentile)(90)

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


  export {
    toDays,
    toHours,
    dateDiff,
    getVessels,
    getPortCalls,
    getPercentile,
    percentile_05,
    percentile_20,
    percentile_50,
    percentile_75,
    percentile_80,
    percentile_90,
    getDelays2714,
    processPortCalls,
    curry,
    compose,
  }

