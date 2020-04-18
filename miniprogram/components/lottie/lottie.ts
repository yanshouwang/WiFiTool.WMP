import lottie = require("lottie-miniprogram");

// interface Context extends WechatMiniprogram.CanvasContext {
//   canvas?: {
//     width: number,
//     height: number
//   }
// }

let ani: lottie.Animation;

Component({
  lifetimes: {
    created() {
      console.log("lottie: created");

    },

    attached() {
      console.log("lottie: attached");

      wx.createSelectorQuery().in(this).select("#canvas").node(res => {
        console.log(res);

        const canvas = res.node;
        console.log(canvas);

        const context = canvas.getContext("2d");

        canvas.width = 2 * canvas.width;
        canvas.height = 2 * canvas.height;

        lottie.setup(canvas);
        const option = {
          name: "lottie",
          loop: true,
          autoplay: true,
          animationData: require("../../images/scanning.js"),
          rendererSettings: {
            context
          }
        };
        ani = lottie.loadAnimation(option);
      }).exec();
    },

    ready() {
      console.log("lottie: ready");

    },

    moved() {
      console.log("lottie: moved");

    },

    detached() {
      console.log("lottie: detached");
      // TODO: 多次 detached 后 lottie 将不再可用，看起来需要 lottie-miniprogram 团队修复某些问题
      // destroy() 方法不可用
      ani.stop();
    },

    error(err) {
      console.log(`lottie: error - ${err}`);

    }
  }
});