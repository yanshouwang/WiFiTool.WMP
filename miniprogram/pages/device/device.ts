import encodeUtf8 = require("encode-utf8");
import decodeUtf8 = require("decode-utf8");
import { Adapter, Modify, Type, Mode } from "../../models/nic";
import { Ask, Answer, Command } from "../../models/command";
import { serviceId, notifyCharacteristicId, writeCharacteristicId } from "../../constants/uuid";

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

Page({
  intervalID: -1,
  hide: false,
  unload: false,
  refreshing: false,
  buffer: new ArrayBuffer(0),

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
    console.log("device.onLoad");

    wx.onBLEConnectionStateChange(res => this.onConnectionStateChange(res));
    wx.onBLECharacteristicValueChange(res => this.onCharacteristicValueChange(res));

    const channel = this.getOpenerEventChannel();
    channel.on("device", device => this.onLoadDevice(device));
  },

  onLoadDevice(device: WechatMiniprogram.CallbackResultBlueToothDevice) {
    console.log(`device.onLoadDevice: ${device}`);

    this.setNavigationBarTitle(device.localName);
    const data: Record<string, any> = {};
    data["device"] = device;
    this.setData(data);
    this.connect();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log("device.onReady");

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log("device.onShow");

    this.hide = false;
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
    console.log("device.onHide");

    this.hide = true;
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log("device.onUnload");

    this.unload = true;
    this.disconnect();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log("device.onPullDownRefresh");

    const data: Record<string, any> = {};
    data["adapters"] = adapters;
    this.setData(data);
    this.getAdapters();
    this.refreshing = true;
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log("device.onReachBottom");

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage(opts): WechatMiniprogram.Page.ICustomShareContent {
    console.log(`device.onShareAppMessage: ${opts}`);
    return {};
  },

  onTapAdapter(e: Record<string, any>) {
    console.log(`device.onTapAdapter: ${e}`);

    const number = e.currentTarget.id;
    const adapter = this.data.adapters[number];
    // 有线网络未连接时不允许修改
    if (adapter.type === Type.Ethernet && adapter.state !== 100) {
      return;
    }
    const option: WechatMiniprogram.NavigateToOption = {
      url: "../adapter/adapter",
      success: res => {
        console.log(`device.onTapAdapter 导航成功: ${res.errMsg}`);

        const channel = res.eventChannel;
        channel.emit("adapter", adapter);
      },
      fail: res => console.log(`device.onTapAdapter 导航失败: ${res.errMsg}`)
    };
    wx.navigateTo(option);
  },

  onConnectionStateChange(res: WechatMiniprogram.OnBLEConnectionStateChangeCallbackResult) {
    console.log(`device.onConnectionStateChange: ${res.deviceId} - ${res.connected}`);

    const device = this.data.device;
    if (res.deviceId !== device.deviceId) {
      return;
    }
    const data: Record<string, any> = {};
    data["connected"] = res.connected;
    this.setData(data);
    if (res.connected) {
      // 获取服务
      const option1: WechatMiniprogram.GetBLEDeviceServicesOption = {
        deviceId: device.deviceId,
        success: res => {
          console.log(`device.onConnectionStateChange 获取服务成功: ${res.errMsg} - ${res.services}`);

          // 获取特征值
          const option2: WechatMiniprogram.GetBLEDeviceCharacteristicsOption = {
            deviceId: device.deviceId,
            serviceId: serviceId,
            success: res => {
              console.log(`device.onConnectionStateChange 获取特征值成功: ${res.errMsg} - ${res.characteristics}`);

              // 打开通知
              const option3: WechatMiniprogram.NotifyBLECharacteristicValueChangeOption = {
                deviceId: device.deviceId,
                serviceId: serviceId,
                characteristicId: notifyCharacteristicId,
                state: true,
                success: res => {
                  console.log(`device.onConnectionStateChange 打开通知成功: ${res.errCode} - ${res.errMsg}`);
                  this.hideLoading();

                  this.keepAlive();
                  if (this.data.adapters.length === 0) {
                    this.getAdapters();
                  } else if (this.data.modify.name === "") {
                    const names = this.data.adapters.map(a => a.name);
                    this.getStatus(names);
                  } else {
                    this.modify();
                  }
                },
                fail: res => console.log(`device.onConnectionStateChange 打开通知失败: ${res.errCode} - ${res.errMsg}`)
              };
              wx.notifyBLECharacteristicValueChange(option3);
            },
            fail: res => console.log(`device.onConnectionStateChange 获取特征值失败: ${res.errCode} - ${res.errMsg}`)
          };
          wx.getBLEDeviceCharacteristics(option2);
        },
        fail: res => console.log(`device.onConnectionStateChange 获取服务失败: ${res.errCode} - ${res.errMsg}`)
      };
      wx.getBLEDeviceServices(option1);
    } else {
      // 停止心跳
      clearInterval(this.intervalID);
      // 断线重连
      if (!this.hide && !this.unload) {
        this.connect();
      }
    }
  },

  onCharacteristicValueChange(res: WechatMiniprogram.OnBLECharacteristicValueChangeCallbackResult) {
    console.log(`device.onCharacteristicValueChange: ${res.deviceId} - ${res.serviceId} - ${res.characteristicId} - ${res.value}`);

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
    console.log(`device.onCharacteristicValueChange 收到回复: ${str}`);

    const answer: Answer = JSON.parse(str);
    this.dealWithAnswer(answer);
    this.buffer = new ArrayBuffer(0);
  },

  dealWithAnswer(answer: Answer) {
    this.hideLoading();
    if (answer.errCode !== 0) {
      if (this.refreshing) {
        wx.stopPullDownRefresh();
      }
      this.showToast(`errCode: ${answer.errCode}`, "../../images/error.png");
      return;
    }
    const cmd = answer.cmd;
    switch (cmd) {
      case Command.GetAdapters: {
        const adapters = (<Adapter[]>answer.adapters).sort((a1, a2) => a1.name.localeCompare(a2.name));
        const data: Record<string, any> = {};
        data["adapters"] = adapters;
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
              console.log(`device.dealWithAnswer 更新适配器: ${adapter.name}`);

              adapter.state = item.state;
              adapter.ssid = item.ssid;
              adapter.ip = item.ip;
              // 未配置时返回 "", 需要改为 "auto"
              adapter.ip.mode = item.ip.mode === Mode.Manual ? Mode.Manual : Mode.Auto;
              adapter.dns = item.dns;
              // 未配置时返回 "", 需要改为 "auto"
              adapter.dns.mode = item.dns.mode === Mode.Manual ? Mode.Manual : Mode.Auto;

              const data: Record<string, any> = {};
              data[`adapters[${i}]`] = adapter;
              this.setData(data);
              break;
            }
          }
        });
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

  connect() {
    const device = this.data.device;
    const option: WechatMiniprogram.CreateBLEConnectionOption = {
      deviceId: device.deviceId,
      success: res => console.log(`device.connect 成功: ${res.errCode} - ${res.errMsg}`),
      fail: res => console.log(`device.connect 失败: ${res.errCode} - ${res.errMsg}`)
    };
    wx.createBLEConnection(option);
    this.showLoading("正在连接");
  },

  disconnect() {
    const device = this.data.device;
    const option: WechatMiniprogram.CloseBLEConnectionOption = {
      deviceId: device.deviceId,
      success: res => console.log(`device.disconnect 成功: ${res.errCode} - ${res.errMsg}`),
      fail: res => console.log(`device.disconnect 失败: ${res.errCode} - ${res.errMsg}`)
    };
    wx.closeBLEConnection(option);
  },

  write(ask: Ask) {
    const str = `${JSON.stringify(ask)}${endSymbol}`;
    console.log(`device.write 写入请求: ${str}`);

    const device = this.data.device;
    const value = encodeUtf8(str);
    const option2: WechatMiniprogram.WriteBLECharacteristicValueOption = {
      deviceId: device.deviceId,
      serviceId: serviceId,
      characteristicId: writeCharacteristicId,
      value: value,
      success: res => console.log(`device.write 成功: ${res.errCode} - ${res.errMsg}`),
      fail: res => console.log(`device.write 失败: ${res.errCode} - ${res.errMsg}`)
    };
    wx.writeBLECharacteristicValue(option2);
  },

  keepAlive() {
    const ask: Ask = {
      cmd: Command.KeepAlive
    };
    this.intervalID = setInterval(() => this.write(ask), 20 * 1000);
  },

  getAdapters() {
    const ask: Ask = {
      cmd: Command.GetAdapters
    };
    this.write(ask);
    this.showLoading("获取适配器列表");
  },

  getStatus(names: string[]) {
    const ask: Ask = {
      cmd: Command.GetStatus,
      names: names
    };
    this.write(ask);
    this.showLoading("获取适配器状态");
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
    this.showLoading("正在配置...");
    // 重置 modify
    const data: Record<string, any> = {};
    data["modify"] = modify;
    this.setData(data);
  },

  showLoading(title: string, ) {
    const option: WechatMiniprogram.ShowLoadingOption = {
      title: title,
      mask: true,
      success: res => console.log(`device.showLoading 成功: ${res.errMsg}`),
      fail: res => console.log(`device.showLoading 失败: ${res.errMsg}`)
    };
    wx.showLoading(option);
  },

  hideLoading() {
    const option: WechatMiniprogram.HideLoadingOption = {
      success: res => console.log(`device.hideLoading 成功: ${res.errMsg}`),
      fail: res => console.log(`device.hideLoading 失败: ${res.errMsg}`)
    };
    wx.hideLoading(option);
  },

  showToast(title: string, image?: string) {
    const option: WechatMiniprogram.ShowToastOption = {
      title: title,
      image: image,
      success: res => console.log(`device.showToast 成功: ${res.errMsg}`),
      fail: res => console.log(`device.showToast 失败: ${res.errMsg}`)
    };
    wx.showToast(option);
  },

  setNavigationBarTitle(title: string) {
    const option: WechatMiniprogram.SetNavigationBarTitleOption = {
      title: title,
      success: res => console.log(`device.setNavigationBarTitle 成功: ${res.errMsg}`),
      fail: res => console.log(`device.setNavigationBarTitle 失败: ${res.errMsg}`)
    };
    wx.setNavigationBarTitle(option);
  }
});