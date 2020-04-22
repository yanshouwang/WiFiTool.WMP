interface Adapter {
  name: string;
  type: Type;
  state: number;
  ssid: string;
  ip: IP;
  dns: DNS;
}

interface Modify {
  name: string,
  ssid: string,
  password: string,
  ip: IP,
  dns: DNS
}

interface IP {
  mode: Mode;
  address: string;
  mask: string;
  gateway: string;
}

interface DNS {
  mode: Mode;
  values: string[];
}

enum Type {
  Ethernet = "ethernet",
  WiFi = "wifi"
}

enum Mode {
  Auto = "auto",
  Manual = "manual"
}

export { Adapter, Modify, IP, DNS, Type, Mode };