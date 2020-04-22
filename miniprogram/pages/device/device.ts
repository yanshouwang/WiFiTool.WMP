import encodeUtf8 = require("encode-utf8");
import decodeUtf8 = require("decode-utf8");
import { Adapter, Modify, Type, Mode } from "../../models/nic";
import { Ask, Answer, Command } from "../../models/command";

const serviceId: string = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
const notifyCharacteristicId: string = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";
const writeCharacteristicId: string = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";

const endSymbol = "\r\n";

const device: WechatMiniprogram.CallbackResultBlueToothDevice = {
  advertisData: new ArrayBuffer(0),
  advertisServiceUUIDs: [],
  serviceData: [],
  deviceId: "",
  RSSI: 0,
  name: "",
  localName: ""
};
const adapters: Adapter[] = [];
const modify: Modify = {
  name: "",
  ssid: "",
  password: "",
  ip: {
    mode: Mode.Auto,
    address: "",
    mask: "",
    gateway: ""
  },
  dns: {
    mode: Mode.Auto,
    values: []
  }
};

let intervalID = -1;
let hide = false;
let unload = false;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    device: device,
    connected: false,
    adapters: adapters,
    modify: modify
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    console.log("device: onLoad");

    wx.onBLEConnectionStateChange(res => this.onConnectionStateChange(res));
    wx.onBLECharacteristicValueChange(res => this.onCharacteristicValueChange(res));

    const channel = this.getOpenerEventChannel();
    channel.on("device", device => this.onLoadDevice(device));
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log("device: onReady");

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log("device: onShow");

    hide = false;
    if (!this.data.connected) {
      this.connect();
    } else if (this.data.modify.name !== "") {
      this.modify();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    console.log("device: onHide");

    hide = true;
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log("device: onUnload");

    unload = true;
    this.disconnect();
  },

  refreshing: false,

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    const data = { adapters: [] };
    this.setData(data);
    this.getAdapters();
    this.refreshing = true;
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage(opts): WechatMiniprogram.Page.ICustomShareContent {
    console.log(opts.target)
    return {}
  },

  onLoadDevice(device: WechatMiniprogram.CallbackResultBlueToothDevice) {
    const data: Record<string, any> = { "device": device };
    this.setData(data);
    this.connect();
  },

  onTapAdapter(e: Record<string, any>) {
    const number = e.currentTarget.id;
    const adapter = this.data.adapters[number];
    // 有线网络未连接时不允许修改
    if (adapter.type === Type.Ethernet && adapter.state !== 100) {
      return;
    }
    const option: WechatMiniprogram.NavigateToOption = {
      url: "../adapter/adapter",
      success: res => {
        console.log("device.onTapAdapter: 成功");

        const channel = res.eventChannel;
        channel.emit("adapter", adapter);
      },
      fail: res => console.log(`device.onTapAdapter: 失败 - ${res.errMsg}`)
    };
    wx.navigateTo(option);
  },

  onConnectionStateChange(res: WechatMiniprogram.OnBLEConnectionStateChangeCallbackResult) {
    const device = this.data.device;
    if (res.deviceId !== device.deviceId) {
      return;
    }
    const connected: boolean = res.connected;
    const data: Record<string, any> = { "connected": connected };
    this.setData(data);
    console.log(`连接状态改变：${connected}`);
    if (connected) {
      // 获取通知特征值，打开通知
      // 获取写入特征值，发送指令
      const option1: WechatMiniprogram.GetBLEDeviceServicesOption = {
        deviceId: device.deviceId,
        success: () => {
          const option2: WechatMiniprogram.GetBLEDeviceCharacteristicsOption = {
            deviceId: device.deviceId,
            serviceId: serviceId,
            success: () => {
              const option3: WechatMiniprogram.NotifyBLECharacteristicValueChangeOption = {
                deviceId: device.deviceId,
                serviceId: serviceId,
                characteristicId: notifyCharacteristicId,
                state: true,
                success: () => {
                  this.keepAlive();
                  if (this.data.adapters.length === 0) {
                    this.getAdapters();
                  } else if (this.data.modify.name !== "") {
                    this.modify();
                  }
                },
                fail: res => console.log(`打开通知失败： ${res.errCode} - ${res.errMsg}`)
              };
              wx.notifyBLECharacteristicValueChange(option3);
            },
            fail: res => console.log(`获取特征值失败： ${res.errCode} - ${res.errMsg}`)
          };
          wx.getBLEDeviceCharacteristics(option2);
        },
        fail: res => console.log(`获取服务失败： ${res.errCode} - ${res.errMsg}`)
      };
      wx.getBLEDeviceServices(option1);
    } else {
      // 停止心跳
      clearInterval(intervalID);
      // 异常断开，尝试重新连接
      if (!hide && !unload) {
        this.connect();
      }
    }
  },

  buffer: new ArrayBuffer(0),

  onCharacteristicValueChange(res: WechatMiniprogram.OnBLECharacteristicValueChangeCallbackResult) {
    console.log("特征值改变");

    const device = this.data.device;
    if (res.deviceId !== device.deviceId || res.serviceId !== serviceId || res.characteristicId !== notifyCharacteristicId) {
      return;
    }

    if (this.buffer.byteLength === 0) {
      this.buffer = res.value;
    } else {
      // 合并 ArrayBuffer
      const olderArray = new Uint8Array(this.buffer);
      const resArray = new Uint8Array(res.value);
      const newerArray = new Uint8Array(olderArray.length + resArray.length);
      newerArray.set(olderArray);
      newerArray.set(resArray, olderArray.length);
      this.buffer = newerArray.buffer;
      // const resView = new DataView(res.value);
      // const olderView = new DataView(this.buffer);
      // const buffer = new ArrayBuffer(this.buffer.byteLength + res.value.byteLength);
      // const newerView = new DataView(buffer);
      // for (let i = 0; i < olderView.byteLength; i++) {
      //   const item = olderView.getUint8(i);
      //   newerView.setUint8(i, item);
      // }
      // for (let i = 0; i < resView.byteLength; i++) {
      //   const item = resView.getUint8(i);
      //   newerView.setUint8(olderView.byteLength + i, item);
      // }
      // this.buffer = newerView.buffer;
    }

    // 是否以 \r\n 结尾
    if (this.buffer.byteLength < 2) {
      return;
    }
    const array = new Uint8Array(this.buffer);
    const code1 = array[array.length - 2];
    const code2 = array[array.length - 1];;
    if (code1 !== 13 || code2 !== 10) {
      return;
    }
    let str: string = decodeUtf8(this.buffer).trim();
    this.dealWithStr(str);
    this.buffer = new ArrayBuffer(0);
  },

  dealWithStr(str: string) {
    console.log(`device.dealWithStr: ${str}`);

    this.hideLoading();
    const answer: Answer = JSON.parse(str);
    if (answer.errCode !== 0) {
      if (this.refreshing) {
        wx.stopPullDownRefresh();
      }
      return;
    }
    const cmd = answer.cmd;
    switch (cmd) {
      case Command.GetAdapters: {
        const adapters = (<Adapter[]>answer.adapters).sort((a1, a2) => a1.name.localeCompare(a2.name));
        const data = { adapters: adapters };
        this.setData(data);
        const names = adapters.map(i => i.name);
        this.getStatus(names);
        break;
      }
      case Command.GetStatus: {
        const status: { name: string, state: number, ssid: string, ip: { mode: Mode, address: string, mask: string, gateway: string }, dns: { mode: Mode, values: string[] } }[] = answer.status;
        const adapters = this.data.adapters;
        status.forEach(item => {
          for (let i = 0; i < adapters.length; i++) {
            const adapter = adapters[i];
            if (adapter.name === item.name) {
              console.log(`找到 ${adapter.name}`);

              adapter.state = item.state;
              adapter.ssid = item.ssid;
              adapter.ip = item.ip;
              adapter.dns = item.dns;
              break;
            }
          }
        });
        const data: Record<string, any> = { adapters: adapters };
        this.setData(data);
        if (this.refreshing) {
          wx.stopPullDownRefresh();
        }
        break;
      }
      case Command.Modify: {
        const names = [answer.name];
        this.getStatus(names);
        break;
      }
      default: {
        break;
      }
    }
  },

  onValuesChange(e: any) {
    const { key } = e.currentTarget.dataset;
    const value = e.detail.value;
    const data: Record<string, any> = {};
    data[key] = value;
    this.setData(data);
  },

  onIPChange(e: any) {
    const { key } = e.currentTarget.dataset;
    const value = e.detail.value;
    const data: Record<string, any> = {};
    data[`ip.${key}`] = value;
    this.setData(data);
  },

  onDNSChange(e: any) {
    const { key } = e.currentTarget.dataset;
    const value = e.detail.value;
    const data: Record<string, any> = {};
    data[`dns.${key}`] = value;
    this.setData(data);
  },

  connect() {
    const device = this.data.device;
    const option: WechatMiniprogram.CreateBLEConnectionOption = {
      deviceId: device.deviceId,
      success: res => console.log(`device.connect 成功：${res.errCode} - ${res.errMsg}`),
      fail: res => console.log(`device.connect 失败：${res.errCode} - ${res.errMsg}`),
      complete: () => this.hideLoading()
    };
    wx.createBLEConnection(option);
    this.showLoading("正在连接");
  },

  disconnect() {
    const device = this.data.device;
    const option: WechatMiniprogram.CloseBLEConnectionOption = {
      deviceId: device.deviceId,
      success: res => console.log(`device.disconnect 成功：${res.errCode} - ${res.errMsg}`),
      fail: res => console.log(`device.disconnect 失败：${res.errCode} - ${res.errMsg}`)
    };
    wx.closeBLEConnection(option);
  },

  write(ask: Ask) {
    const str = `${JSON.stringify(ask)}${endSymbol}`;
    const device = this.data.device;
    const value = encodeUtf8(str);
    const option2: WechatMiniprogram.WriteBLECharacteristicValueOption = {
      deviceId: device.deviceId,
      serviceId: serviceId,
      characteristicId: writeCharacteristicId,
      value: value,
      success: () => console.log(`写入成功：${str}`),
      fail: res => console.log(`写入失败： ${res.errCode} - ${res.errMsg}`)
    };
    wx.writeBLECharacteristicValue(option2);
  },

  keepAlive() {
    const ask: Ask = {
      cmd: Command.KeepAlive
    };
    intervalID = setInterval(() => this.write(ask), 20 * 1000);
  },

  getAdapters() {
    const ask: Ask = {
      cmd: Command.GetAdapters
    };
    this.write(ask);
    this.showLoading("正在获取适配器列表");
  },

  getStatus(names: string[]) {
    const ask: Ask = {
      cmd: Command.GetStatus,
      names: names
    };
    this.write(ask);
    this.showLoading("正在获取适配器状态");
  },

  modify() {
    const ask: Ask = {
      cmd: Command.Modify,
      name: this.data.modify.name,
      ssid: this.data.modify.ssid,
      password: this.data.modify.password,
      ip: this.data.modify.ip,
      dns: this.data.modify.dns
    };
    this.write(ask);
    const data = { modify: modify };
    this.setData(data);
    this.showLoading("正在配置网络连接");
  },

  showLoading(title: string) {
    const option: WechatMiniprogram.ShowLoadingOption = {
      title: title,
      mask: true,
      success: res => console.log(`device.showLoading 成功：${res.errMsg}`),
      fail: res => console.log(`device.showLoading 失败：${res.errMsg}`)
    };
    wx.showLoading(option);
  },

  hideLoading() {
    const option: WechatMiniprogram.HideLoadingOption = {
      success: res => console.log(`device.hideLoading 成功：${res.errMsg}`),
      fail: res => console.log(`device.hideLoading 失败：${res.errMsg}`)
    };
    wx.hideLoading(option);
  }
});