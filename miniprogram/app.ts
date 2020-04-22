// app.ts
App<IAppOption>({
  globalData: {},

  /**
   * 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
   */
  onLaunch() {
    console.log("app.onLaunch");

  },

  /**
   * 当小程序启动，或从后台进入前台显示，会触发 onShow
   */
  onShow(opts) {
    console.log(`app.onShow: ${JSON.stringify(opts)}`);

  },

  /**
   * 当小程序从前台进入后台，会触发 onHide
   */
  onHide() {
    console.log("app.onHide");

  },

  /**
   * 当小程序发生脚本错误，或者 api 调用失败时，会触发 onError 并带上错误信息
   */
  onError(msg) {
    console.log(`app.onError: ${msg}`);

  },
});