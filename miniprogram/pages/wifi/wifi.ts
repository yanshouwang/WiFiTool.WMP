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
    console.log("wifi.onLoad");

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
    console.log("wifi.onReady");

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log("wifi.onShow");

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    console.log("wifi.onHide");

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log("wifi.onUnload");

    // 关闭 WiFi 模块
    this.stopWiFi();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log("wifi.onPullDownRefresh");

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log("wifi.onReachBottom");

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage(opts): WechatMiniprogram.Page.ICustomShareContent {
    console.log(`wifi.onShareAppMessage: ${opts}`);
    return {};
  },

  onLoadSSID(ssid: string) {
    console.log(`wifi.onLoadSSID: ${ssid}`);

    const data: Record<string, any> = {};
    data["ssid"] = ssid;
    this.setData(data);
  },

  onGetWiFiList(res: WechatMiniprogram.OnGetWifiListCallbackResult) {
    console.log(`wifi.onGetWiFiList: ${res.wifiList}`);

    let wifis = this.data.wifis.concat(res.wifiList);
    wifis = this.distinct(wifis).sort((w1, w2) => w1.SSID.localeCompare(w2.SSID));
    console.log(wifis);

    const data: Record<string, any> = {};
    data["wifis"] = wifis;
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
      success: res => {
        console.log(`wifi.startWiFi 成功: ${res.errCode} - ${res.errMsg}`);

        this.getConnectedWiFi();
      },
      fail: res => console.log(`wifi.startWiFi 失败: ${res.errCode} - ${res.errMsg}`)
    };
    wx.startWifi(option);
  },

  stopWiFi() {
    const option: WechatMiniprogram.StopWifiOption = {
      success: res => console.log(`wifi.stopWiFi 成功: ${res.errCode} -${res.errMsg}`),
      fail: res => console.log(`wifi.stopWiFi 失败: ${res.errCode} - ${res.errMsg}`)
    };
    wx.stopWifi(option);
  },

  getConnectedWiFi() {
    const option: WechatMiniprogram.GetConnectedWifiOption = {
      success: res => {
        console.log(`wifi.getConnectedWiFi 成功: ${res.errMsg} - ${res.wifi}`);

        const data: Record<string, any> = {};
        data["wifis[0]"] = res.wifi;
        this.setData(data);
        this.getSystemInfo();
      },
      fail: res => console.log(`wifi.getConnectedWiFi 失败: ${res.errCode} - ${res.errMsg}`)
    };
    wx.getConnectedWifi(option);
  },

  getSystemInfo() {
    const option1: WechatMiniprogram.GetSystemInfoOption = {
      success: res => {
        console.log(`wifi.getSystemInfo 成功: ${JSON.stringify(res)}`);

        // iOS 需要提示用户跳转系统设置界面
        if (res.platform === "ios") {
          const option2: WechatMiniprogram.ShowModalOption = {
            title: "提示",
            content: "由于系统限制，iOS 用户请手动进入系统 WiFi 页面，当列表中出现目标 WiFi 时再返回小程序。",
            showCancel: false,
            success: res => {
              console.log(`wifi.getSystemInfo 提示成功: ${res.errMsg} - ${res.confirm} - ${res.cancel}`);

              if (res.confirm) {
                this.getWiFiList();
              }
            },
            fail: res => console.log(`wifi.getSystemInfo 提示失败：${res.errMsg}`)
          };
          wx.showModal(option2);
        } else {
          this.getWiFiList();
        }
      },
      fail: res => console.log(`wifi.getSystemInfo 失败: ${res.errMsg}`)
    };
    wx.getSystemInfo(option1);
  },

  getWiFiList() {
    const option1: WechatMiniprogram.GetSettingOption = {
      success: res => {
        console.log(`wifi.getWiFiList 获取设置成功: ${res.errMsg} - ${res.authSetting}`);

        if (res.authSetting["scope.userLocation"]) {
          const option2: WechatMiniprogram.GetWifiListOption = {
            success: res => console.log(`wifi.getWiFiList 成功: ${res.errCode} - ${res.errMsg}`),
            fail: res => console.log(`wifi.getWiFiList 失败: ${res.errCode} - ${res.errMsg}`)
          };
          wx.getWifiList(option2);
        } else {
          this.authorize();
        }
      },
      fail: res => console.log(`wifi.getWiFiList 获取设置失败: ${res.errMsg}`)
    };
    wx.getSetting(option1);
  },

  authorize() {
    const option: WechatMiniprogram.AuthorizeOption = {
      scope: "scope.userLocation",
      success: res => {
        console.log(`wifi.authorize 成功: ${res.errMsg}`);

        this.getWiFiList();
      },
      fail: res => console.log(`wifi.authorize 失败: ${res.errMsg}`)
    };
    wx.authorize(option);
  }
})