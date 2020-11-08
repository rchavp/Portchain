import React from 'react';
import './App.css';
import { Port, Vessel } from './external/types'
import { toHours } from './external/funcs'
import { getAggregates } from './external/aggregateService'

type Result = {
  portsFullProcessedData: Array<Port>;
  vesselsFullProcessedData: Array<Vessel>;
}
type State = {
  hasError: boolean;
  portsFullProcessedData?: Array<Port>;
  vesselsFullProcessedData?: Array<Vessel>;
  ex?: Error;
}

/* async function App() { */
class App extends React.Component<{}, State> {

  constructor (props: any) {
    super(props)
    this.state = {
      hasError: false,
    }
  }

  componentDidMount () {
    getAggregates().then((result: Result) => {
      this.setState({
        hasError: false,
        portsFullProcessedData: result.portsFullProcessedData,
        vesselsFullProcessedData: result.vesselsFullProcessedData,
    })}).catch(ex => {
      this.setState({hasError: true, ex})
    })
  }

  render() {
    if (this.state.hasError) {
      console.error('ERROR DUDE', this.state.ex)
      return (
        <div className="App">
          There was an error while processing data<br/>
          {this.state.ex!}
        </div>
      )
    }
    if (this.state.portsFullProcessedData && this.state.vesselsFullProcessedData) {
      const portsData = this.state.portsFullProcessedData
      const vesselsData = this.state.vesselsFullProcessedData
      const top5Ports = portsData.slice(-5).sort((p1, p2) => p2.totalVisits - p1.totalVisits)
      const portPercMarks = ['5','20','50','75','90']
      const vesselPercMarks = ['5','50','90']
      const lower5Ports = portsData.slice(0, 5)
      return (
        <div className="App">
          <div className="Main">
            <h2>Top 5 Ports</h2>
            <div>
              {top5Ports.map(p => (
                <div>Name {p.name} ({p.id}) Total Visits: {p.totalVisits}</div>
              ))}
            </div>
            <h2>Lower 5 Ports</h2>
            <div>
              {lower5Ports.map(p => (
                <div>Name {p.name} ({p.id}) Total Visits: {p.totalVisits}</div>
              ))}
            </div>
            <h2>All Ports</h2>
            <div>
              {portsData.map(p => (
                <div>
                  <div><b>Name:</b> {p.name} ({p.id}) Total Visits: {p.totalVisits}</div>
                  <div>Duration Percentiles: {p.percentiles.map((d, i) => portPercMarks[i]+'%: '+toHours(d).toFixed(2)+'hours / ')}</div><br/>
                </div>
              ))}
            </div>
            <h2>All Vessels</h2>
            <div>
              {vesselsData.map(v => (
                <div>
                  <div><b>Name:</b> {v.name} ({v.imo})</div>
                  <div>2Day delays Percentiles: {v.percentiles2Day.map((d, i) => vesselPercMarks[i]+'%: '+toHours(d).toFixed(2)+' hours / ')}</div>
                  <div>7Day delays Percentiles: {v.percentiles7Day.map((d, i) => vesselPercMarks[i]+'%: '+toHours(d).toFixed(2)+' hours / ')}</div>
                  <div>14Day delays Percentiles: {v.percentiles14Day.map((d, i) => vesselPercMarks[i]+'%: '+toHours(d).toFixed(2)+' hours / ')}</div><br/>
                </div>
              ))}
            </div>
            </div>
        </div>
      )
    } else {
      return (
        <div className="App">
          No data returned
        </div>
      )
    }
  }

}

export default App;
