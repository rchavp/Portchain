type DelayEnumType = '2Day' | '7Day' | '14Day';
type Delays = { [key in DelayEnumType]: number }

type MapOfPorts = { [key: string]: Port }
type MapOfVessels = { [key: string]: Vessel }

type Vessel = {
  imo: number;
  name: string;
  allDelays: Array<Delays>;
  percentiles2Day: Array<number>;
  percentiles7Day: Array<number>;
  percentiles14Day: Array<number>;
}

type Port = {
  id: string;
  name: string;
  durations: Array<number>;
  delays: Array<LogDelay>;
  percentiles: Array<number>;
  totalVisits: number;
}

type LogDelay = {
  forecastedArrival: string;
  actualArrival: string;
  forecastDate: string;
}

type LogEntry = {
  updatedField: string;
  arrival: string | null;
  departure: string | null;
  isOmitted: boolean | null;
  createdDate: string;
}

type Call = {
  vessel: Vessel;
  port: Port;
  arrival: string;
  departure: string;
  createdDate: string;
  isOmitted: boolean;
  service: string;
  logEntries: Array<LogEntry>;
}

type ProcessedCall = {
  arrival: string;
  departure: string;
  createdDate: string;
  isOmitted: boolean;
  service: string;
  port: Port;
  vessel: Vessel;
  duration: number;
  delays: Delays
}

export type {
  Vessel,
  Port,
  LogEntry,
  Call,
  LogDelay,
  DelayEnumType,
  Delays,
  ProcessedCall,
  MapOfPorts,
  MapOfVessels,
}
