class VesselApiError extends Error {
  constructor(message: any) {
    super(message);
    this.name = "VesselApiError";
  }
}

class PortCallApiError extends Error {
  constructor(message: any) {
    super(message);
    this.name = "PortCallApiError";
  }
}

export {
  VesselApiError,
  PortCallApiError,
}
