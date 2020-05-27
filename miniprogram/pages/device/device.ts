import { Encodings } from "@yanshouwang/core";
import { Adapter, Modify, Type, Mode } from "../../models/nic";
import { Ask, Answer, Command } from "../../models/command";
import { serviceId, notifyCharacteristicId, writeCharacteristicId } from "../../constants/uuid";
import WX = WechatMiniprogram;

const endSymbol = "\r\n";
const device: WX.CallbackResultBlueToothDevice = {
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
  writing: false,

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
    wx.onBLEConnectionStateChange(res => this.onConnectionStateChange(res));
    wx.onBLECharacteristicValueChange(res => this.onCharacteristicValueChange(res));

    const channel = this.getOpenerEventChannel();
    channel.on("device", device => this.onLoadDevice(device));
  },

  async onLoadDevice(device: WX.CallbackResultBlueToothDevice) {
    const data: WX.IAnyObject = {};
    data["device"] = device;
    this.setData(data);
    await this.setNavigationBarTitle(device.localName);
    await this.connect();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  async onShow() {
    this.hide = false;
    if (!this.data.connected) {
      await this.connect();
    } else if (this.data.modify.name !== "") {
      await this.modify();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    this.hide = true;
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  async onUnload() {
    this.unload = true;
    await this.disconnect();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  async onPullDownRefresh() {
    this.refreshing = true;
    const data: WX.IAnyObject = {};
    data["adapters"] = adapters;
    this.setData(data);
    await this.getAdapters();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage(opts): WX.Page.ICustomShareContent {
    console.log(opts.target);
    return {};
  },

  async onTapAdapter(e: WX.IAnyObject) {
    const number = e.currentTarget.id;
    const adapter = this.data.adapters[number];
    // 有线网络未连接时不允许修改
    if (adapter.type === Type.Ethernet && adapter.state !== 100) {
      return;
    }
    const option: WX.NavigateToOption = { url: "../adapter/adapter" };
    const res = await wx.navigateTo(option);
    const channel = res.eventChannel;
    channel.emit("adapter", adapter);
  },

  async onConnectionStateChange(res: WX.OnBLEConnectionStateChangeCallbackResult) {
    const device = this.data.device;
    if (res.deviceId !== device.deviceId) {
      return;
    }
    const data: WX.IAnyObject = {};
    data["connected"] = res.connected;
    this.setData(data);
    if (res.connected) {
      // 获取服务
      const option1: WX.GetBLEDeviceServicesOption = { deviceId: device.deviceId };
      await wx.getBLEDeviceServices(option1);
      // 获取特征值
      const option2: WX.GetBLEDeviceCharacteristicsOption = {
        deviceId: device.deviceId,
        serviceId: serviceId
      };
      await wx.getBLEDeviceCharacteristics(option2);
      // 打开通知
      const option3: WX.NotifyBLECharacteristicValueChangeOption = {
        deviceId: device.deviceId,
        serviceId: serviceId,
        characteristicId: notifyCharacteristicId,
        state: true
      };
      await wx.notifyBLECharacteristicValueChange(option3);
      this.hideLoading();
      // 开始心跳
      this.keepAlive();
      if (this.data.adapters.length === 0) {
        await this.getAdapters();
      } else if (this.data.modify.name === "") {
        const names = this.data.adapters.map(a => a.name);
        await this.getStatus(names);
      } else {
        await this.modify();
      }
    } else {
      // 停止心跳
      clearInterval(this.intervalID);
      // 断线重连
      if (!this.hide && !this.unload) {
        await this.connect();
      }
    }
  },

  async onCharacteristicValueChange(res: WX.OnBLECharacteristicValueChangeCallbackResult) {
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
    const codes = new Uint8Array(this.buffer);
    const code1 = codes[codes.length - 2];
    const code2 = codes[codes.length - 1];
    if (code1 !== 0x0D || code2 !== 0x0A) {
      return;
    }
    const str = Encodings.UTF8.toString(codes).trim();
    this.buffer = new ArrayBuffer(0);
    console.debug(`device.onCharacteristicValueChange: ${str}`);

    const answer: Answer = JSON.parse(str);
    await this.dealWithAnswer(answer);
  },

  async dealWithAnswer(answer: Answer) {
    this.hideLoading();
    if (answer.errCode !== 0) {
      if (this.refreshing) {
        this.stopPullDownRefresh();
      }
      this.showToast(`errCode: ${answer.errCode}`, "../../images/error.png");
      return;
    }
    const cmd = answer.cmd;
    switch (cmd) {
      case Command.GetAdapters: {
        const adapters = (<Adapter[]>answer.adapters).sort((a1, a2) => a1.name.localeCompare(a2.name));
        const data: WX.IAnyObject = {};
        data["adapters"] = adapters;
        this.setData(data);
        const names = adapters.map(i => i.name);
        await this.getStatus(names);
        break;
      }
      case Command.GetStatus: {
        const status: { name: string, state: number, ssid: string, ip: { mode: Mode, address: string, mask: string, gateway: string }, dns: { mode: Mode, values: string[] } }[] = answer.status;
        const adapters = this.data.adapters;
        status.forEach(item => {
          for (let i = 0; i < adapters.length; i++) {
            const adapter = adapters[i];
            if (adapter.name === item.name) {
              adapter.state = item.state;
              adapter.ssid = item.ssid;
              adapter.ip = item.ip;
              // 未配置时返回 "", 需要改为 "auto"
              adapter.ip.mode = item.ip.mode === Mode.Manual ? Mode.Manual : Mode.Auto;
              adapter.dns = item.dns;
              // 未配置时返回 "", 需要改为 "auto"
              adapter.dns.mode = item.dns.mode === Mode.Manual ? Mode.Manual : Mode.Auto;

              const data: WX.IAnyObject = {};
              data[`adapters[${i}]`] = adapter;
              this.setData(data);
              break;
            }
          }
        });
        if (this.refreshing) {
          await this.stopPullDownRefresh();
        }
        break;
      }
      case Command.Modify: {
        const names = [answer.name];
        await this.getStatus(names);
        break;
      }
      default: {
        break;
      }
    }
  },

  async connect() {
    await this.showLoading("正在连接");
    const device = this.data.device;
    const option: WX.CreateBLEConnectionOption = { deviceId: device.deviceId };
    await wx.createBLEConnection(option);
  },

  async disconnect() {
    const device = this.data.device;
    const option: WX.CloseBLEConnectionOption = { deviceId: device.deviceId };
    await wx.closeBLEConnection(option);
  },

  async write(ask: Ask) {
    if (this.writing) {
      // 等待
      setTimeout(() => this.write(ask), 500);
      return;
    }
    this.writing = true;
    // 不可以同时写，使用队列暂存
    const device = this.data.device;
    const mtu = 20;   // 20 字节分包
    const str = JSON.stringify(ask);
    console.debug(`device.write: ${str}`);

    const buffer = Encodings.UTF8.toBytes(`${str}${endSymbol}`).buffer;
    const count = Math.floor(buffer.byteLength / mtu);
    const remainder = buffer.byteLength % mtu;
    for (let i = 0; i < count; i++) {
      const begin = i * mtu;
      const end = begin + mtu;
      const value = buffer.slice(begin, end);
      const option: WX.WriteBLECharacteristicValueOption = {
        deviceId: device.deviceId,
        serviceId: serviceId,
        characteristicId: writeCharacteristicId,
        value: value
      };
      await wx.writeBLECharacteristicValue(option);
    }
    if (remainder > 0) {
      const begin = count * mtu;
      const end = begin + remainder;
      const value = buffer.slice(begin, end);
      const option: WX.WriteBLECharacteristicValueOption = {
        deviceId: device.deviceId,
        serviceId: serviceId,
        characteristicId: writeCharacteristicId,
        value: value
      };
      await wx.writeBLECharacteristicValue(option);
    }
    this.writing = false;
  },

  keepAlive() {
    const ask: Ask = { cmd: Command.KeepAlive };
    this.intervalID = setInterval(() => this.write(ask), 20 * 1000);
  },

  killSelf() {
    clearInterval(this.intervalID);
  },

  async getAdapters() {
    await this.showLoading("获取适配器列表");
    const ask: Ask = { cmd: Command.GetAdapters };
    await this.write(ask);
  },

  async getStatus(names: string[]) {
    await this.showLoading("获取适配器状态");
    const ask: Ask = {
      cmd: Command.GetStatus,
      names: names
    };
    await this.write(ask);
  },

  async modify() {
    await this.showLoading("正在配置...");
    // 重置 modify
    const data: WX.IAnyObject = {};
    data["modify"] = modify;
    this.setData(data);
    const ask: Ask = {
      cmd: Command.Modify,
      name: this.data.modify.name,
      ssid: this.data.modify.ssid,
      password: this.data.modify.password,
      ip: this.data.modify.ip,
      dns: this.data.modify.dns
    };
    await this.write(ask);
  },

  async showLoading(title: string) {
    const option: WX.ShowLoadingOption = {
      title: title,
      mask: true
    };
    await wx.showLoading(option);
  },

  async hideLoading() {
    await wx.hideLoading({});
  },

  async showToast(title: string, image?: string) {
    const option: WX.ShowToastOption = {
      title: title,
      image: image
    };
    await wx.showToast(option);
  },

  async setNavigationBarTitle(title: string) {
    const option: WX.SetNavigationBarTitleOption = { title: title };
    await wx.setNavigationBarTitle(option);
  },

  async stopPullDownRefresh() {
    await wx.stopPullDownRefresh();
  }
});