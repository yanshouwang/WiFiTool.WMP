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

  async onLoad() {
    wx.onBluetoothAdapterStateChange(res => this.onAdapterStateChange(res));
    wx.onBluetoothDeviceFound(res => this.onDeviceFound(res));
    // 初始化蓝牙模块
    await this.openAdapter();
  },

  onReady() {

  },

  async onShow() {
    this.hide = false;
    if (this.data.available && !this.data.discovering) {
      await this.startDiscovery();
    }
  },

  async onHide() {
    this.hide = true;
    if (this.data.available && this.data.discovering) {
      await this.stopDiscovery();
    }
  },

  async onUnload() {
    // 关闭蓝牙模块
    await this.closeAdapter();
  },

  async onPullDownRefresh() {
    const data: WX.IAnyObject = {};
    data["devices"] = [];
    this.setData(data);
    await this.stopPullDownRefresh();
  },

  async onTapDevice(e: WX.IAnyObject) {
    const option: WX.NavigateToOption = { url: "../device/device" };
    const res = await wx.navigateTo(option);
    const channel = res.eventChannel;
    const i: number = e.currentTarget.id;
    const device = this.data.devices[i];
    channel.emit("device", device);
  },

  async onAdapterStateChange(res: WX.OnBluetoothAdapterStateChangeCallbackResult) {
    const data: WX.IAnyObject = {};
    data["available"] = res.available;
    data["discovering"] = res.discovering;
    this.setData(data);

    if (res.available) {
      if (this.hide && res.discovering) {
        // 页面处于隐藏状态时停止搜索
        await this.stopDiscovery();
      } else if (!this.hide && !res.discovering) {
        // 页面处于显示状态时开始搜索
        await this.startDiscovery();
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

  async openAdapter() {
    const option: WX.OpenBluetoothAdapterOption = {};
    await wx.openBluetoothAdapter(option);
    const res = await wx.getBluetoothAdapterState();
    await this.onAdapterStateChange(res);
  },

  async closeAdapter() {
    await wx.closeBluetoothAdapter();
  },

  async startDiscovery() {
    const option: WX.StartBluetoothDevicesDiscoveryOption = {
      allowDuplicatesKey: true,
      services: [serviceId]
    }
    await wx.startBluetoothDevicesDiscovery(option);
  },

  async stopDiscovery() {
    await wx.stopBluetoothDevicesDiscovery();
  },

  async stopPullDownRefresh() {
    await wx.stopPullDownRefresh();
  }
});