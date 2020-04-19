const wifis: WechatMiniprogram.WifiInfo[] = [];
const wifi: WechatMiniprogram.WifiInfo = {
  BSSID: "",
  SSID: "",
  secure: false,
  signalStrength: 0
};

const auto = "自动";
const manual = "手动";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    device: {},
    type: "wifi",
    wifis: wifis,
    wifi: wifi,
    password: "",
    modes: [
      auto,
      manual
    ],
    ip: {
      mode: auto,
      address: "",
      mask: "",
      gateway: "",
    },
    dns: {
      mode: auto,
      values: []
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    wx.onGetWifiList(res => this.onGetWiFiList(res));

    // 打开 WiFi 模块
    this.startWiFi();
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

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 关闭 WiFi 模块
    this.stopWiFi();
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

  onGetWiFiList(res: WechatMiniprogram.OnGetWifiListCallbackResult) {
    let wifis = res.wifiList;
    const wifi = this.data.wifi;
    if (wifi.SSID !== "") {
      wifis.unshift(wifi);
    }
    wifis = this.distinct(res.wifiList).sort((w1, w2) => w1.SSID.localeCompare(w2.SSID));
    console.log(wifis);

    const data = { wifis: wifis };
    this.setData(data);
  },

  onTapSSID() {
    const option1: WechatMiniprogram.GetSystemInfoOption = {
      success: res => {
        console.log(`获取系统信息成功：${JSON.stringify(res)}`);

        // iOS 需要提示用户跳转系统设置界面
        if (res.platform === "ios") {
          const option2: WechatMiniprogram.ShowModalOption = {
            title: "提示",
            content: "由于系统限制，iOS 用户请手动进入系统 WiFi 页面，当列表中出现目标 WiFi 时再返回小程序。",
            showCancel: false,
            success: res => {
              console.log("提示框弹出成功");

              if (res.confirm) {
                this.navigateToWiFi();
              }
            },
            fail: res => console.log(`提示窗弹出失败：${res.errMsg}`)
          };
          wx.showModal(option2);
        } else {
          this.navigateToWiFi();
        }
      },
      fail: res => console.log(`获取系统信息失败：${res.errMsg}`)
    };
    wx.getSystemInfo(option1);
    //this.getWiFiList();
  },

  onIPModeChange(e: Record<string, any>) {
    const number = e.detail.value;
    const mode = this.data.modes[number];
    const data: Record<string, any> = {};
    data["ip.mode"] = mode;
    this.setData(data);
  },

  onDNSModeChange(e: Record<string, any>) {
    const number = e.detail.value;
    const mode = this.data.modes[number];
    const data: Record<string, any> = {};
    data["dns.mode"] = mode;
    this.setData(data);
  },

  navigateToWiFi() {
    const wifi = this.data.wifi;
    const option: WechatMiniprogram.NavigateToOption = {
      url: "../wifi/wifi",
      success: res => {
        console.log("跳转 WiFi 页面成功");

        res.eventChannel.emit("wifi", wifi);
      },
      fail: res => console.log(`跳转 WiFi 页面失败：${res.errMsg}`)
    };
    wx.navigateTo(option);
  },

  onWiFiChange(e: any) {
    const number = e.detail.value;
    const ssid = this.data.wifis[number].SSID;
    const data = { "ssid": ssid };
    this.setData(data);
  },

  distinct(arr: WechatMiniprogram.WifiInfo[]): WechatMiniprogram.WifiInfo[] {
    const res: WechatMiniprogram.WifiInfo[] = [];
    arr.forEach(w1 => {
      const some = res.some(w2 => w1.SSID === w2.SSID);
      if (some) {
        return;
      }
      res.push(w1);
    });
    return res;
  },

  onSubmit() {
    // const mode = "";
    // const address = this.data.address;
    // const mask = this.data.mask;
    // const gateway = this.data.ip.gateway;
    // const dns = this.data.dns.values;
    // switch (mode) {
    //   case ethernet: {
    //     this.modify("ethernet", address, mask, gateway, dns);
    //     break;
    //   }
    //   case wifi: {
    //     const ssid = this.data.ssid;
    //     const password = this.data.password;
    //     this.modify("wifi", address, mask, gateway, dns, ssid, password);
    //     break;
    //   }
    //   default: {
    //     console.log(`连接模式错误：${mode}`);
    //     break;
    //   }
    // }
  },

  startWiFi() {
    const option: WechatMiniprogram.StartWifiOption = {
      success: () => {
        console.log("打开 WiFi 模块成功");

        this.getConnectedWiFi();
      },
      fail: res => console.log(`打开 WiFi 模块失败：${res.errCode} - ${res.errMsg}`)
    };
    wx.startWifi(option);
  },

  stopWiFi() {
    const option: WechatMiniprogram.StopWifiOption = {
      success: () => console.log("关闭 WiFi 模块成功"),
      fail: res => console.log(`关闭 WiFi 模块失败：${res.errCode} - ${res.errMsg}`)
    };
    wx.stopWifi(option);
  },

  getConnectedWiFi() {
    const option: WechatMiniprogram.GetConnectedWifiOption = {
      success: res => {
        const wifi = res.wifi;
        console.log(`获取已连接 WiFi 成功: ${wifi}`);

        const data = { "wifis": [wifi], "ssid": wifi.SSID };
        this.setData(data);
      },
      fail: res => console.log(`获取已连接 WiFi 失败: ${res.errCode} - ${res.errMsg}`)
    };
    wx.getConnectedWifi(option);
  },

  getWiFiList() {
    const option1: WechatMiniprogram.GetSettingOption = {
      success: res => {
        console.log(`获取设置成功：${res.authSetting}`);

        if (res.authSetting["scope.userLocation"]) {
          const option2: WechatMiniprogram.GetWifiListOption = {
            success: () => console.log(`获取 WiFi 列表成功`),
            fail: res => console.log(`获取 WiFi 列表失败：${res.errCode} - ${res.errMsg}`)
          };
          wx.getWifiList(option2);
        } else {
          this.authorize();
        }
      },
      fail: res => console.log(`获取设置失败：${res.errMsg}`)
    };
    wx.getSetting(option1);
  },

  authorize() {
    const option: WechatMiniprogram.AuthorizeOption = {
      scope: "scope.userLocation",
      success: () => {
        console.log("申请权限成功");

        this.getWiFiList();
      },
      fail: res => console.log(`申请权限失败：${res.errMsg}`)
    };
    wx.authorize(option);
  },
})