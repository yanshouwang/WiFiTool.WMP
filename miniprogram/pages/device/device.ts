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

  onLoadDevice(device: WX.CallbackResultBlueToothDevice) {
    this.setNavigationBarTitle(device.localName);
    const data: WX.IAnyObject = {};
    data["device"] = device;
    this.setData(data);
    this.connect();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
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
    this.hide = true;
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    this.unload = true;
    this.disconnect();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    const data: WX.IAnyObject = {};
    data["adapters"] = adapters;
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
  onShareAppMessage(opts): WX.Page.ICustomShareContent {
    console.log(opts.target);
    return {};
  },

  onTapAdapter(e: WX.IAnyObject) {
    const number = e.currentTarget.id;
    const adapter = this.data.adapters[number];
    // 有线网络未连接时不允许修改
    if (adapter.type === Type.Ethernet && adapter.state !== 100) {
      return;
    }
    const option: WX.NavigateToOption = { url: "../adapter/adapter" };
    wx.navigateTo(option)
      .then(res => res.eventChannel.emit("adapter", adapter))
      .catch(err => console.error(`device.onTapAdapter: ${JSON.stringify(err)}`));
  },

  onConnectionStateChange(res: WX.OnBLEConnectionStateChangeCallbackResult) {
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
      wx.getBLEDeviceServices(option1)
        .then(() => {
          // 获取特征值
          const option2: WX.GetBLEDeviceCharacteristicsOption = {
            deviceId: device.deviceId,
            serviceId: serviceId
          };
          return wx.getBLEDeviceCharacteristics(option2);
        })
        .then(() => {
          // 打开通知
          const option3: WX.NotifyBLECharacteristicValueChangeOption = {
            deviceId: device.deviceId,
            serviceId: serviceId,
            characteristicId: notifyCharacteristicId,
            state: true
          };
          return wx.notifyBLECharacteristicValueChange(option3);
        })
        .then(() => {
          this.hideLoading();
          // 开始心跳
          this.keepAlive();
          if (this.data.adapters.length === 0) {
            this.getAdapters();
          } else if (this.data.modify.name === "") {
            const names = this.data.adapters.map(a => a.name);
            this.getStatus(names);
          } else {
            this.modify();
          }
        })
        .catch(err => console.error(`device.onConnectionStateChange: ${JSON.stringify(err)}`));
    } else {
      // 停止心跳
      clearInterval(this.intervalID);
      // 断线重连
      if (!this.hide && !this.unload) {
        this.connect();
      }
    }
  },

  onCharacteristicValueChange(res: WX.OnBLECharacteristicValueChangeCallbackResult) {
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
    const code2 = codes[codes.length - 1];;
    if (code1 !== 0x0D || code2 !== 0x0A) {
      return;
    }
    const str: string = Encodings.UTF8.toString(codes).trim();
    console.debug(`device.onCharacteristicValueChange 收到回复: ${str}`);

    const answer: Answer = JSON.parse(str);
    this.dealWithAnswer(answer);
    this.buffer = new ArrayBuffer(0);
  },

  dealWithAnswer(answer: Answer) {
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
          this.stopPullDownRefresh();
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
    const option: WX.CreateBLEConnectionOption = { deviceId: device.deviceId };
    wx.createBLEConnection(option)
      .catch(err => console.error(`device.connect: ${JSON.stringify(err)}`));
    this.showLoading("正在连接");
  },

  disconnect() {
    const device = this.data.device;
    const option: WX.CloseBLEConnectionOption = { deviceId: device.deviceId };
    wx.closeBLEConnection(option)
      .catch(err => console.error(`device.disconnect: ${JSON.stringify(err)}`));
  },

  write(ask: Ask) {
    const str = `${JSON.stringify(ask)}${endSymbol}`;
    const device = this.data.device;
    const codes = Encodings.UTF8.toBytes(str);
    const option2: WX.WriteBLECharacteristicValueOption = {
      deviceId: device.deviceId,
      serviceId: serviceId,
      characteristicId: writeCharacteristicId,
      value: codes.buffer
    };
    wx.writeBLECharacteristicValue(option2)
      .catch(err => console.error(`device.write: ${JSON.stringify(err)}`));
  },

  keepAlive() {
    const ask: Ask = { cmd: Command.KeepAlive };
    this.intervalID = setInterval(() => this.write(ask), 20 * 1000);
  },

  getAdapters() {
    const ask: Ask = { cmd: Command.GetAdapters };
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
    const data: WX.IAnyObject = {};
    data["modify"] = modify;
    this.setData(data);
  },

  showLoading(title: string) {
    const option: WX.ShowLoadingOption = {
      title: title,
      mask: true
    };
    wx.showLoading(option)
      .catch(err => console.error(`device.showLoading: ${JSON.stringify(err)}`));
  },

  hideLoading() {
    wx.hideLoading({})
      .catch(err => console.error(`device.hideLoading: ${JSON.stringify(err)}`));
  },

  showToast(title: string, image?: string) {
    const option: WX.ShowToastOption = {
      title: title,
      image: image
    };
    wx.showToast(option)
      .catch(err => console.error(`device.showToast: ${JSON.stringify(err)}`));
  },

  setNavigationBarTitle(title: string) {
    const option: WX.SetNavigationBarTitleOption = { title: title };
    wx.setNavigationBarTitle(option)
      .catch(err => console.error(`device.setNavigationBarTitle: ${JSON.stringify(err)}`));
  },

  stopPullDownRefresh() {
    wx.stopPullDownRefresh()
      .catch(err => console.error(`device.stopPullDownRefresh: ${JSON.stringify(err)}`));
  }
});