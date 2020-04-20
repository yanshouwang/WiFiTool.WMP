const wobj1: WechatMiniprogram.WifiInfo[] = [];
const wobj2: WechatMiniprogram.WifiInfo = {
  BSSID: "",
  SSID: "",
  secure: false,
  signalStrength: 0
};

Page({

  /**
   * 页面的初始数据
   */
  data: {
    wifis: wobj1,
    wifi: wobj2
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    wx.onGetWifiList(res => this.onGetWiFiList(res));

    const channel = this.getOpenerEventChannel();
    channel.once("wifi", wifi => this.onLoadWiFi(wifi));
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

  onLoadWiFi(wifi: WechatMiniprogram.WifiInfo) {
    const data = { wifi: wifi };
    this.setData(data);

    this.getWiFiList();
  },

  onGetWiFiList(res: WechatMiniprogram.OnGetWifiListCallbackResult) {
    let wifis = res.wifiList.concat(this.data.wifi);
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

  onWiFiChange(e: Record<string, any>) {
    const number = e.detail.value;
    const wifi = this.data.wifis[number];
    const data = { "wifi": wifi };
    this.setData(data);

    const channel = this.getOpenerEventChannel();
    channel.emit("wifi", wifi);
  }
})