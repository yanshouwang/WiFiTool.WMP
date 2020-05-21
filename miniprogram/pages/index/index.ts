// index.ts
import { inArray } from "../../utils/util";
import { serviceId } from "../../constants/uuid";
import { scan } from "../../images/scan";
import WX = WechatMiniprogram;

const obj: WX.CallbackResultBlueToothDevice[] = [
  // {
  //   advertisData: new ArrayBuffer(0),
  //   advertisServiceUUIDs: [],
  //   serviceData: {},
  //   deviceId: "AA86730D-C651-4A3E-AB40-C1C7A3EBCE9F",
  //   name: "TEST 01",
  //   localName: "We Test",
  //   RSSI: -40
  // }
];

Page({
  hide: false,

  data: {
    available: false,
    discovering: false,
    devices: obj,
    scan: scan
  },

  onLoad() {
    wx.onBluetoothAdapterStateChange(res => this.onAdapterStateChange(res));
    wx.onBluetoothDeviceFound(res => this.onDeviceFound(res));
    // 初始化蓝牙模块
    this.openAdapter();
  },

  onReady() {

  },

  onShow() {
    this.hide = false;
    if (this.data.available && !this.data.discovering) {
      this.startDiscovery();
    }
  },

  onHide() {
    this.hide = true;
    if (this.data.available && this.data.discovering) {
      this.stopDiscovery();
    }
  },

  onUnload() {
    // 关闭蓝牙模块
    this.closeAdapter();
  },

  onPullDownRefresh() {
    const data: WX.IAnyObject = {};
    data["devices"] = [];
    this.setData(data);
    this.stopPullDownRefresh();
  },

  onTapDevice(e: WX.IAnyObject) {
    const option: WX.NavigateToOption = { url: "../device/device" };
    wx.navigateTo(option)
      .then(res => {
        const i: number = e.currentTarget.id;
        const device = this.data.devices[i];
        res.eventChannel.emit("device", device);
      })
      .catch(err => console.error(`device.onTapDevice 导航失败: ${JSON.stringify(err)}`));
  },

  onAdapterStateChange(res: WX.OnBluetoothAdapterStateChangeCallbackResult) {
    const data: WX.IAnyObject = {};
    data["available"] = res.available;
    data["discovering"] = res.discovering;
    this.setData(data);

    if (res.available) {
      if (this.hide && res.discovering) {
        // 页面处于隐藏状态时停止搜索
        this.stopDiscovery();
      } else if (!this.hide && !res.discovering) {
        // 页面处于显示状态时开始搜索
        this.startDiscovery();
      }
    }
  },

  onDeviceFound(res: WX.OnBluetoothDeviceFoundCallbackResult) {
    res.devices.forEach(device => {
      const data: WX.IAnyObject = {};
      const i = inArray(this.data.devices, 'deviceId', device.deviceId);
      if (i === -1) {
        const length = this.data.devices.length;
        data[`devices[${length}]`] = device;
      } else {
        data[`devices[${i}]`] = device;
      }
      this.setData(data);
    });
  },

  openAdapter() {
    wx.openBluetoothAdapter({})
      .then(() => wx.getBluetoothAdapterState({}))
      .then(res => this.onAdapterStateChange(res))
      .catch(err => console.error(`index.openAdapter 失败: ${JSON.stringify(err)}`));
  },

  closeAdapter() {
    wx.closeBluetoothAdapter({})
      .catch(err => console.error(`index.closeAdapter 失败: ${JSON.stringify(err)}`));
  },

  startDiscovery() {
    const option: WX.StartBluetoothDevicesDiscoveryOption = {
      allowDuplicatesKey: true,
      services: [serviceId]
    }
    wx.startBluetoothDevicesDiscovery(option)
      .catch(err => console.error(`index.startDiscovery 失败: ${JSON.stringify(err)}`));
  },

  stopDiscovery() {
    wx.stopBluetoothDevicesDiscovery({})
      .catch(err => console.error(`index.stopDiscovery 失败: ${JSON.stringify(err)}`));
  },

  stopPullDownRefresh() {
    wx.stopPullDownRefresh({})
      .catch(err => console.error(`index.stopPullDownRefresh 失败: ${JSON.stringify(err)}`));
  }
});