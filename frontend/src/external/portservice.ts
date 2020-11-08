import {
  Vessel,
  Port,
  Call,
  ProcessedCall,
  MapOfPorts,
} from './types'

import {
  getPortCalls,
  percentile_05,
  percentile_20,
  percentile_50,
  percentile_75,
  percentile_90,
} from './funcs'
import { PortCallApiError } from './customErrors'

const getAllProcessedPortCalls = async (vessels: Array<Vessel>): Promise<Array<Call>> => {
  // Get dataset for all portcalls by iterating over all vessels,
  // and make sure to include the Vessel info in the PortCall
  // Also try to make all request asynchronously
  const apiRequestsForPortCalls = vessels.map(vessel =>
    getPortCalls(vessel).then( portCalls => portCalls.map(call => ({...call, vessel})) ))

  let resolvedRequests: Array<Array<Call>>
  try {
    resolvedRequests = await Promise.all(apiRequestsForPortCalls)
  } catch (ex) {
    throw new PortCallApiError(ex)
  }

  // Flatmap all PortCalls
  const allPortCalls = resolvedRequests.reduce((allCalls: Array<Call>, callsPerVessel: Array<Call>) =>
    [...allCalls, ...callsPerVessel]
  ,[])

  return allPortCalls
}

const getProcessedPorts = (processedCalls: Array<ProcessedCall>) => {
  // Get sorted aggregated Port data by aggregating the PortCalls
  // This will return an array of all Ports with their data for durations
  // flattened as an array property
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

  const portsFullProcessedData = portsAggrAndSorted.map((port: Port) =>
    ({
      ...port,
      percentiles: [
        percentile_05(port.durations),
        percentile_20(port.durations),
        percentile_50(port.durations),
        percentile_75(port.durations),
        percentile_90(port.durations),
      ],
    })
  )
   return portsFullProcessedData as Array<Port>
}

export {
  getAllProcessedPortCalls,
  getProcessedPorts,
}
