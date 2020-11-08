import { ProcessedCall } from './types'
import { getVessels, processPortCalls } from './funcs'
import { VesselApiError, PortCallApiError } from './customErrors' 
import { getAllProcessedPortCalls, getProcessedPorts } from './portservice'
import { getProcessedVessels } from './vesselservice'

const getAggregates = async (): Promise<any> => {
  try {
    // Get dataset for vessels
    const vessels = await getVessels()

    // Get dataset of all PortCalls based on the list of vessels
    const allPortCalls = await getAllProcessedPortCalls(vessels)

    // Transform (process) all portcalls to enhace them with the data for 2,7,14 days delays and durations
    const processedCalls: Array<ProcessedCall> = processPortCalls(allPortCalls)

    // Get a full list of Ports with all processed information
    const portsFullProcessedData = getProcessedPorts(processedCalls)

    // Get a full list of Vessels with all processed information
    const vesselsFullProcessedData = getProcessedVessels(processedCalls)

    return { portsFullProcessedData, vesselsFullProcessedData }

  } catch(ex) {
    if (ex instanceof VesselApiError) {
      console.error('Error while calling the Vessel Api', ex)
      return {}
    } else if (ex instanceof PortCallApiError) {
      console.error('Error while calling the PortCall Api', ex)
      return {}
    }
  }
}

export {
  getAggregates,
}
