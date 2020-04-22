import { Adapter, Mode, Modify, IP, DNS, Type } from "../../models/nic";

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
}

const auto = "自动";
const manual = "手动";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    type: Type.Ethernet,
    older: modify,
    newer: modify,
    modes: [
      auto,
      manual
    ],
    number0: 0,
    number1: 0,
    disabled1: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    console.log("adapter.onLoad");

    const channel = this.getOpenerEventChannel();
    channel.on("adapter", adapter => this.onLoadAdapter(adapter));
  },

  onLoadAdapter(adapter: Adapter) {
    console.log(`adapter.onLoadAdapter: ${adapter}`);

    const older: Modify = {
      name: adapter.name,
      password: "",
      ssid: adapter.ssid,
      ip: adapter.ip,
      dns: adapter.dns
    };
    const str = JSON.stringify(older);
    const newer: Modify = JSON.parse(str);
    const data: Record<string, any> = {};
    data["type"] = adapter.type;
    data["older"] = older;
    data["newer"] = newer;
    if (adapter.ip.mode === Mode.Manual) {
      data["number0"] = 1;
      data["disabled1"] = true;
    }
    if (adapter.dns.mode === Mode.Manual) {
      data["number1"] = 1;
    }
    this.setData(data);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log("adapter.onReady");

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log("adapter.onShow");

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    console.log("adapter.onHide");

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log("adapter.onUnload");

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log("adapter.onPullDownRefresh");

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log("adapter.onReachBottom");

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage(opts): WechatMiniprogram.Page.ICustomShareContent {
    console.log(`adapter.onShareAppMessage: ${opts}`);

    return {};
  },

  onTapSSID() {
    console.log("adapter.onTapSSID");

    const ssid = this.data.newer.ssid;
    const option: WechatMiniprogram.NavigateToOption = {
      url: "../wifi/wifi",
      success: res => {
        console.log(`adapter.onTapSSID: 导航成功: ${res.errMsg}`);

        const channel = res.eventChannel;
        channel.emit("ssid", ssid);
      },
      fail: res => console.log(`adapter.onTapSSID: 导航失败: ${res.errMsg}`)
    };
    wx.navigateTo(option);
  },

  onValuesChange(e: Record<string, any>) {
    console.log(`adapter.onValuesChange: ${e}`);

    const key = e.currentTarget.dataset.key;
    const value = e.detail.value;
    const data: Record<string, any> = {};
    data[`newer.${key}`] = value;
    this.setData(data);
  },

  onIPModeChange(e: Record<string, any>) {
    console.log(`adapter.onIPModeChange: ${JSON.stringify(e)}`);

    const number = parseInt(e.detail.value);
    if (number === this.data.number0) {
      return;
    }
    const data: Record<string, any> = {};
    const mode = number === 0 ? Mode.Auto : Mode.Manual;
    data["newer.ip.mode"] = mode;
    data["number0"] = number;
    if (number === 0) {
      data["disabled1"] = false;
    } else {
      data["disabled1"] = true;
      if (this.data.newer.dns.mode !== Mode.Manual) {
        data["newer.dns.mode"] = Mode.Manual;
        data["number1"] = 1;
      }
    }
    this.setData(data);
  },

  onIPValuesChange(e: Record<string, any>) {
    console.log(`adapter.onIPValuesChange: ${e}`);

    const key = e.currentTarget.dataset.key;
    const value = e.detail.value;
    const data: Record<string, any> = {};
    data[`newer.ip.${key}`] = value;
    this.setData(data);
  },

  onDNSModeChange(e: Record<string, any>) {
    console.log(`adapter.onDNSModeChange: ${e}`);

    const number = parseInt(e.detail.value);
    if (number === this.data.number1) {
      return;
    }
    const data: Record<string, any> = {};
    const mode = number === 0 ? Mode.Auto : Mode.Manual;
    data["newer.dns.mode"] = mode;
    data["number1"] = number;
    this.setData(data);
  },

  onDNSValuesChange(e: Record<string, any>) {
    console.log(`adapter.onDNSValuesChange: ${e}`);

    const key = e.currentTarget.dataset.key;
    const value = e.detail.value;
    const data: Record<string, any> = {};
    if (key === "dns1") {
      data["newer.dns.values[0]"] = value;
    } else {
      data["newer.dns.values[1]"] = value;
    }
    this.setData(data);
  },

  setSSID(ssid: string) {
    const data: Record<string, any> = {};
    data["newer.ssid"] = ssid;
    this.setData(data);
  },

  onSubmit() {
    const changed = this.changed();
    console.log(`adapter.onSubmit: ${changed} - ${JSON.stringify(this.data.older)} - ${JSON.stringify(this.data.newer)}`);

    if (!changed) {
      return;
    }
    const pages = getCurrentPages();
    const page = pages[pages.length - 2];
    const ip: IP = this.data.newer.ip.mode === Mode.Auto ? { mode: Mode.Auto, address: "", mask: "", gateway: "" } : this.data.newer.ip;
    const dns: DNS = this.data.newer.dns.mode == Mode.Auto ? { mode: Mode.Auto, values: [] } : this.data.newer.dns;
    const modify: Modify = {
      name: this.data.newer.name,
      ssid: this.data.newer.ssid,
      password: this.data.newer.password,
      ip: ip,
      dns: dns
    };
    const data = { modify: modify };
    page.setData(data);
    this.navigateBack();
  },

  changed(): boolean {
    const newer = this.data.newer;
    const older = this.data.older;
    let changed =
      newer.name !== older.name ||
      newer.ssid !== older.ssid ||
      newer.password !== older.password ||
      newer.ip.mode !== older.ip.mode ||
      newer.ip.address !== older.ip.address ||
      newer.ip.mask !== older.ip.mask ||
      newer.ip.gateway !== older.ip.gateway ||
      newer.dns.mode !== older.dns.mode ||
      newer.dns.values.length !== older.dns.values.length;
    if (!changed) {
      for (let i = 0; i < newer.dns.values.length; i++) {
        const v1 = newer.dns.values[i];
        const v2 = older.dns.values[i];
        if (v1 !== v2) {
          changed = true;
          break;
        }
      }
    }
    return changed;
  },

  navigateBack() {
    const option: WechatMiniprogram.NavigateBackOption = {
      success: res => console.log(`adapter.navigateBack 成功: ${res.errMsg}`),
      fail: res => console.log(`adapter.navigateBack 失败: ${res.errMsg}`)
    };
    wx.navigateBack(option);
  }
})