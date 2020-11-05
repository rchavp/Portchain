import { Vessel, Port } from './types'
import { toHours } from './funcs'


const printResultsToConsole = (portsData: Array<Port>, vesselsData: Array<Vessel>) => {

  const top5Ports = portsData.slice(-5).sort((p1, p2) => p2.totalVisits - p1.totalVisits)
  const lower5Ports = portsData.slice(0, 5)
  
  console.log('')
  console.log('////////////////////////////////////////////////////////////////////////')
  console.log('//////////////////////////////// RESULTS ///////////////////////////////')
  console.log('////////////////////////////////////////////////////////////////////////')
  console.log('')
  console.log('Top 5 Ports per visits (more visits first)')
  top5Ports.forEach(p => {
    console.log(`  Port: ${p.name} (${p.id}). Visits: ${p.totalVisits}`)
  })
  console.log(`------------------------------------------------------------------------`)

  console.log('Lower 5 Ports per visits (more visits first)')
  lower5Ports.forEach(p => {
    console.log(`  Port: ${p.name} (${p.id}). Visits: ${p.totalVisits}`)
  })

  console.log('')

  console.log('////////////////////////////////////////////////////////////////////////')
  console.log('///////////////////////////////// PORTS ////////////////////////////////')
  console.log('////////////////////////////////////////////////////////////////////////')
  console.log('')
  portsData.forEach(p => {
    console.log(`Port: ${p.name} (${p.id}). Visits: ${p.totalVisits}`)
    console.log(`Duration Percentiles:`, p.percentiles.map(d => `${toHours(d).toFixed(2)} hours`))
    console.log(`------------------------------------------------------------------------`)
  })

  console.log('')

  console.log('////////////////////////////////////////////////////////////////////////')
  console.log('//////////////////////////////// VESSELS ///////////////////////////////')
  console.log('////////////////////////////////////////////////////////////////////////')
  console.log('')
  vesselsData.forEach(v => {
    console.log(`Vessel: ${v.name} (${v.imo})`)
    console.log(`2Day delays Percentiles:`, v.percentiles2Day.map(d => `${toHours(d).toFixed(2)} hours`))
    console.log(`7Day delays Percentiles:`, v.percentiles7Day.map(d => `${toHours(d).toFixed(2)} hours`))
    console.log(`14Day delays Percentiles:`, v.percentiles14Day.map(d => `${toHours(d).toFixed(2)} hours`))
    console.log(`------------------------------------------------------------------------`)
  })
}

export {
  printResultsToConsole,
}
