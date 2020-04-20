namespace Models {
  export class Device {

    State: DeviceState = DeviceState.Disconnected;

    constructor(public Id: string, public Name: string, public SSID: number) {

    }

    /**
     * Connect
     */
    public Connect(fail: Function) {
      if (this.State !== DeviceState.Disconnected) {
        fail.apply(this);
      }
    }

    /**
     * GetAdapters
     */
    public GetAdapters() {

    }
  }
}