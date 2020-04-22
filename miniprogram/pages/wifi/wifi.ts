const wobj1: WechatMiniprogram.WifiInfo[] = [];

Page({

  /**
   * 页面的初始数据
   */
  data: {
    wifis: wobj1,
    ssid: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    wx.onGetWifiList(res => this.onGetWiFiList(res));

    const channel = this.getOpenerEventChannel();
    channel.on("ssid", ssid => this.onLoadSSID(ssid));

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

  onLoadSSID(ssid: string) {
    const data = { ssid: ssid };
    this.setData(data);
  },

  onGetWiFiList(res: WechatMiniprogram.OnGetWifiListCallbackResult) {
    let wifis = this.data.wifis.concat(res.wifiList);
    wifis = this.distinct(wifis).sort((w1, w2) => w1.SSID.localeCompare(w2.SSID));
    console.log(wifis);

    const data = { wifis: wifis };
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

  onWiFiChange(e: Record<string, any>) {
    console.log(`wifi.onWiFiChange: - ${JSON.stringify(e)}`);

    const number = e.detail.value;
    const wifi = this.data.wifis[number];
    const data = { "ssid": wifi.SSID };
    this.setData(data);

    const pages = getCurrentPages();
    const page = pages[pages.length - 2];
    page.setSSID(wifi.SSID);
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
        console.log(`获取已连接 WiFi 成功: ${JSON.stringify(wifi)}`);

        const data = { wifis: [wifi] };
        this.setData(data);
        this.getSystemInfo();
      },
      fail: res => console.log(`获取已连接 WiFi 失败: ${res.errCode} - ${res.errMsg}`)
    };
    wx.getConnectedWifi(option);
  },

  getSystemInfo() {
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
                this.getWiFiList();
              }
            },
            fail: res => console.log(`提示窗弹出失败：${res.errMsg}`)
          };
          wx.showModal(option2);
        } else {
          this.getWiFiList();
        }
      },
      fail: res => console.log(`获取系统信息失败：${res.errMsg}`)
    };
    wx.getSystemInfo(option1);
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
  }
})