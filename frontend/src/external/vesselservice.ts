import {
  Vessel,
  Delays,
  ProcessedCall,
  MapOfVessels
} from './types'

import {
    percentile_05,
    percentile_50,
    percentile_80,
} from './funcs'

const getProcessedVessels = (processedCalls: Array<ProcessedCall>): Array<Vessel> => {
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

  const vesselsFullProcessedData = vesselsAggregated.map((vessel: Vessel) => {
    const allDelays2Day = vessel.allDelays.map((d: Delays) => d['2Day'])
    const allDelays7Day = vessel.allDelays.map((d: Delays) => d['7Day'])
    const allDelays14Day = vessel.allDelays.map((d: Delays) => d['14Day'])
    return {
      ...vessel,
      percentiles2Day: [
        percentile_05(allDelays2Day),
        percentile_50(allDelays2Day),
        percentile_80(allDelays2Day),
      ],
      percentiles7Day: [
        percentile_05(allDelays7Day),
        percentile_50(allDelays7Day),
        percentile_80(allDelays7Day),
      ],
      percentiles14Day: [
        percentile_05(allDelays14Day),
        percentile_50(allDelays14Day),
        percentile_80(allDelays14Day),
      ],
    } as Vessel
  })
  return vesselsFullProcessedData
}

export {
  getProcessedVessels,
}

