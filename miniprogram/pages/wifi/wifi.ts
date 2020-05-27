import WX = WechatMiniprogram;

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
  async onLoad() {
    wx.onGetWifiList(res => this.onGetWiFiList(res));
    const channel = this.getOpenerEventChannel();
    channel.on("ssid", ssid => this.onLoadSSID(ssid));
    // 打开 WiFi 模块
    await wx.startWifi();
    // 获取已连接 WiFi
    try {
      await this.getConnectedWiFi();
    } catch (error) {     
      // 手机未连接 WiFi 时会报错，Catch 掉，否则无法继续获取 WiFi 列表
      const str = JSON.stringify(error);
      console.debug(str);
    }
    // 获取 WiFi 列表
    await this.getSystemWiFiList();
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
  async onUnload() {
    // 关闭 WiFi 模块
    await wx.stopWifi();
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
    console.log(`wifi.onShareAppMessage: ${opts}`);
    return {};
  },

  onLoadSSID(ssid: string) {
    const data: WX.IAnyObject = {};
    data["ssid"] = ssid;
    this.setData(data);
  },

  onGetWiFiList(res: WechatMiniprogram.OnGetWifiListCallbackResult) {
    let wifis = this.data.wifis.concat(res.wifiList);
    wifis = this.distinct(wifis).sort((w1, w2) => w1.SSID.localeCompare(w2.SSID));

    const data: WX.IAnyObject = {};
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

  onWiFiChange(e: WX.IAnyObject) {
    const number = e.detail.value;
    const wifi = this.data.wifis[number];
    const data = { "ssid": wifi.SSID };
    this.setData(data);

    const pages = getCurrentPages();
    const page = pages[pages.length - 2];
    page.setSSID(wifi.SSID);
  },

  async getConnectedWiFi() {
    const res = await wx.getConnectedWifi();
    const data: WX.IAnyObject = {};
    data["wifis[0]"] = res.wifi;
    this.setData(data);
  },

  async getSystemWiFiList() {
    const res1 = await wx.getSystemInfo();
    // iOS 需要提示用户跳转系统设置界面
    if (res1.platform === "ios") {
      const option2: WechatMiniprogram.ShowModalOption = {
        title: "提示",
        content: "由于系统限制，iOS 用户请手动进入系统 WiFi 页面，当列表中出现目标 WiFi 时再返回小程序。",
        showCancel: false
      };
      const res2 = await wx.showModal(option2);
      if (res2.confirm) {
        await this.getWiFiList();
      }
    } else {
      await this.getWiFiList();
    }
  },

  async getWiFiList() {
    const option: WechatMiniprogram.GetSettingOption = {};
    const res = await wx.getSetting(option);
    if (res.authSetting["scope.userLocation"]) {
      await wx.getWifiList();
    } else {
      await this.authorize();
    }
  },

  async authorize() {
    const option: WechatMiniprogram.AuthorizeOption = { scope: "scope.userLocation" }
    await wx.authorize(option);
    await this.getWiFiList();
  }
})