class VesselApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "VesselApiError";
  }
}

class PortCallApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "PortCallApiError";
  }
}

export {
  VesselApiError,
  PortCallApiError,
}
