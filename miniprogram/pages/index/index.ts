// index.ts
const serviceId: string = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";

function inArray(arr: string | any[], key: string | number, val: any) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}

const obj: WechatMiniprogram.CallbackResultBlueToothDevice[] = [
  // {
  //   advertisData: new ArrayBuffer(0),
  //   advertisServiceUUIDs: [],
  //   serviceData: {},
  //   deviceId: "AA86730D-C651-4A3E-AB40-C1C7A3EBCE9F",
  //   name: "TEST 01",
  //   localName: "We Test",
  //   RSSI: -59
  // }
];

let hide = false;

Page({
  data: {
    available: true,
    discovering: false,
    devices: obj
  },

  // onTest() {
  //   const data: Record<string, any> = {};
  //   data["available"] = !this.data.available;
  //   this.setData(data);
  // },

  onLoad() {
    console.log("index: onLoad");

    wx.onBluetoothAdapterStateChange(res => this.onAdapterStateChange(res));
    wx.onBluetoothDeviceFound(res => this.onDeviceFound(res));
    // 初始化蓝牙模块
    this.openAdapter();
  },

  onReady() {
    console.log("index: onReady");

  },

  onShow() {
    console.log("index: onShow");

    hide = false;
    if (this.data.available && !this.data.discovering) {
      this.startDiscovery();
    }
  },

  onHide() {
    console.log("index: onHide");

    hide = true;
    if (this.data.available && this.data.discovering) {
      this.stopDiscovery();
    }
  },

  onUnload() {
    console.log("index: onUnload");

    // 关闭蓝牙模块
    this.closeAdapter();
  },

  onPullDownRefresh() {
    const data: Record<string, any> = {};
    data["devices"] = [];
    this.setData(data);
    wx.stopPullDownRefresh();

    // setTimeout(() => {
    //   const data: Record<string, any> = {};
    //   data["devices"] = obj;
    //   this.setData(data);
    // }, 5000);
  },

  onTapDevice(e: any) {
    const i: number = e.currentTarget.id;
    const device = this.data.devices[i];
    const option: WechatMiniprogram.NavigateToOption = {
      url: "../device/device",
      success: res => res.eventChannel.emit("device", device)
    };
    wx.navigateTo(option);
  },

  onAdapterStateChange(res: WechatMiniprogram.OnBluetoothAdapterStateChangeCallbackResult) {
    console.log(`蓝牙适配器状态改变：${res.available} - ${res.discovering}`);

    const data: Record<string, any> = {
      "available": res.available,
      "discovering": res.discovering
    };
    this.setData(data);

    if (res.available) {
      if (hide && res.discovering) {
        this.stopDiscovery();
      } else if (!hide && !res.discovering) {
        this.startDiscovery();
      }
    }
  },

  onDeviceFound(res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) {
    res.devices.forEach(device => {
      const data: { [key: string]: any } = {};
      const i = inArray(this.data.devices, 'deviceId', device.deviceId);
      if (i === -1) {
        console.log(`发现设备：${JSON.stringify(device)}`);

        const length = this.data.devices.length;
        data[`devices[${length}]`] = device;
      } else {
        data[`devices[${i}]`] = device;
      }
      this.setData(data);
    });
  },

  openAdapter() {
    const option: WechatMiniprogram.OpenBluetoothAdapterOption = {
      success: () => {
        console.log("打开蓝牙模块成功");

        this.onAdapterOpen();
      },
      fail: res => console.log(`打开蓝牙模块失败：${res.errCode} - ${res.errMsg}`)
    };
    wx.openBluetoothAdapter(option);
  },

  onAdapterOpen() {
    const option1: WechatMiniprogram.GetBluetoothAdapterStateOption = {
      success: res => {
        console.log(`获取蓝牙适配器状态成功：${res.available} - ${res.discovering}`);

        this.onAdapterStateChange(res);
      },
      fail: res => console.log(`获取蓝牙适配器状态失败：${res.errCode} - ${res.errMsg}`)
    };
    wx.getBluetoothAdapterState(option1);
  },

  closeAdapter() {
    const option: WechatMiniprogram.CloseBluetoothAdapterOption = {
      success: () => console.log("关闭蓝牙模块成功"),
      fail: res => console.log(`关闭蓝牙模块失败：${res.errCode} - ${res.errMsg}`)
    };
    wx.closeBluetoothAdapter(option);
  },

  startDiscovery() {
    const option: WechatMiniprogram.StartBluetoothDevicesDiscoveryOption = {
      allowDuplicatesKey: true,
      services: [serviceId],
      success: () => console.log("开始扫描成功"),
      fail: res => console.log(`开始扫描失败：${res.errCode} - ${res.errMsg}`)
    }
    wx.startBluetoothDevicesDiscovery(option);
  },

  stopDiscovery() {
    const option: WechatMiniprogram.StopBluetoothDevicesDiscoveryOption = {
      success: () => console.log("停止扫描成功"),
      fail: res => console.log(`停止扫描失败：${res.errCode} - ${res.errMsg}`)
    };
    wx.stopBluetoothDevicesDiscovery(option);
  }
});