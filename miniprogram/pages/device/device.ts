import encodeUtf8 = require("encode-utf8");
import decodeUtf8 = require("decode-utf8");

const serviceId: string = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
const notifyCharacteristicId: string = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";
const writeCharacteristicId: string = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";
const getStatusCmd: string = "GET STUTAS";
const modifyCmd: string = "MODIFY";
const keepAliveCmd: string = "KEEP ALIVE";

const endSymbol = "\r\n";

const ethernet = "ethernet";
const wifi = "wifi";

const obj1: WechatMiniprogram.CallbackResultBlueToothDevice = {
  advertisData: new ArrayBuffer(0),
  advertisServiceUUIDs: [],
  serviceData: [],
  deviceId: "",
  RSSI: 0,
  name: "",
  localName: ""
};

let intervalID = -1;
let hide = false;
let unload = false;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    device: obj1,
    connected: true,
    adapters: [
      {
        type: ethernet,
        connected: false
      },
      {
        type: wifi,
        connected: false
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    console.log("device: onLoad");

    wx.onBLEConnectionStateChange(res => this.onConnectionStateChange(res));
    wx.onBLECharacteristicValueChange(res => this.onCharacteristicValueChange(res));

    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on("device", (device: WechatMiniprogram.CallbackResultBlueToothDevice) => this.onLoadDevice(device));
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

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

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

  onTapAdapter(e: any) {
    const device = this.data.device;
    const i = e.currentTarget.id;
    const adapter = this.data.adapters[i];
    const option: WechatMiniprogram.NavigateToOption = {
      url: "../adapter/adapter",
      success: res => res.eventChannel.emit("adapter", device, adapter)
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
                  this.getStatus();
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

  onCharacteristicValueChange(res: WechatMiniprogram.OnBLECharacteristicValueChangeCallbackResult) {
    console.log("特征值改变");

    const device = this.data.device;
    if (res.deviceId !== device.deviceId || res.serviceId !== serviceId || res.characteristicId !== notifyCharacteristicId) {
      return;
    }
    let str: string = decodeUtf8(res.value).trim();
    console.log(str);

    const value: { [str: string]: any, cmd: string, errCode: number } = JSON.parse(str);
    const cmd = value.cmd;
    switch (cmd) {
      case getStatusCmd:
      case modifyCmd: {
        const obj = {
          ssid: value.ssid,
          address: value.address,
          mask: value.mask,
          gateway: value.gateway,
          dns: value.dns
        };
        const data: Record<string, any> = {};
        switch (value.mode) {
          case "ethernet": {
            data["ethernet"] = obj;
            data["wifi"] = {};
            break;
          }
          case "wifi": {
            data["ethernet"] = {};
            data["wifi"] = obj;
            break;
          }
          case "none": {
            data["ethernet"] = {};
            data["ethernet"] = {};
            break;
          }
          default: {
            break;
          }
        }
        this.setData(data);
        wx.hideLoading();
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
    const connected = this.data.connected;
    if (connected) {
      return;
    }
    const device = this.data.device;
    const option: WechatMiniprogram.CreateBLEConnectionOption = {
      deviceId: device.deviceId,
      success: () => console.log(`连接成功`),
      fail: res => console.log(`连接失败：${res.errCode} - ${res.errMsg}`)
    };
    wx.createBLEConnection(option);
    this.showLoading("正在连接");
  },

  disconnect() {
    const connected = this.data.connected;
    if (!connected) {
      return;
    }
    const device = this.data.device;
    const option: WechatMiniprogram.CloseBLEConnectionOption = {
      deviceId: device.deviceId,
      success: () => console.log(`断开成功`),
      fail: res => console.log(`断开失败：${res.errCode} - ${res.errMsg}`)
    };
    wx.closeBLEConnection(option);
  },

  write(str: string) {
    str = `${str}${endSymbol}`;
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
    const value = {
      cmd: keepAliveCmd
    };
    const str = JSON.stringify(value);
    intervalID = setInterval(() => this.write(str), 20 * 1000);
  },

  getStatus() {
    const value = {
      cmd: getStatusCmd
    };
    const str = JSON.stringify(value);
    this.write(str);
  },

  modify(mode: "ethernet" | "wifi", address: string, mask: string, gateway: string, dns: string[], ssid?: string, password?: string) {
    const value = {
      cmd: modifyCmd,
      mode: mode,
      ssid: ssid,
      password: password,
      address: address,
      mask: mask,
      gateway: gateway,
      dns: dns
    };
    const str = JSON.stringify(value);
    this.write(str);
    this.showLoading("正在配置网络");
  },

  showLoading(title: string) {
    const option: WechatMiniprogram.ShowLoadingOption = {
      title: title,
      mask: true
    };
    wx.showLoading(option);
  }
});