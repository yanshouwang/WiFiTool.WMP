"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lottie = require("lottie-miniprogram");
var ani;
Component({
    lifetimes: {
        created: function () {
            console.log("lottie: created");
        },
        attached: function () {
            console.log("lottie: attached");
            wx.createSelectorQuery().in(this).select("#canvas").node(function (res) {
                console.log(res);
                var canvas = res.node;
                console.log(canvas);
                var context = canvas.getContext("2d");
                canvas.width = 2 * canvas.width;
                canvas.height = 2 * canvas.height;
                lottie.setup(canvas);
                var option = {
                    name: "lottie",
                    loop: true,
                    autoplay: true,
                    animationData: require("../../images/scanning.js"),
                    rendererSettings: {
                        context: context
                    }
                };
                ani = lottie.loadAnimation(option);
            }).exec();
        },
        ready: function () {
            console.log("lottie: ready");
        },
        moved: function () {
            console.log("lottie: moved");
        },
        detached: function () {
            console.log("lottie: detached");
            ani.stop();
        },
        error: function (err) {
            console.log("lottie: error - " + err);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG90dGllLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG90dGllLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQThDO0FBUzlDLElBQUksR0FBcUIsQ0FBQztBQUUxQixTQUFTLENBQUM7SUFDUixTQUFTLEVBQUU7UUFDVCxPQUFPO1lBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBRWpDLENBQUM7UUFFRCxRQUFRO1lBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBRWhDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsR0FBRztnQkFDMUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFFakIsSUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztnQkFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFcEIsSUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFeEMsTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDaEMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFFbEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDckIsSUFBTSxNQUFNLEdBQUc7b0JBQ2IsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsSUFBSSxFQUFFLElBQUk7b0JBQ1YsUUFBUSxFQUFFLElBQUk7b0JBQ2QsYUFBYSxFQUFFLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQztvQkFDbEQsZ0JBQWdCLEVBQUU7d0JBQ2hCLE9BQU8sU0FBQTtxQkFDUjtpQkFDRixDQUFDO2dCQUNGLEdBQUcsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ1osQ0FBQztRQUVELEtBQUs7WUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBRS9CLENBQUM7UUFFRCxLQUFLO1lBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUUvQixDQUFDO1FBRUQsUUFBUTtZQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUdoQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDYixDQUFDO1FBRUQsS0FBSyxZQUFDLEdBQUc7WUFDUCxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFtQixHQUFLLENBQUMsQ0FBQztRQUV4QyxDQUFDO0tBQ0Y7Q0FDRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbG90dGllID0gcmVxdWlyZShcImxvdHRpZS1taW5pcHJvZ3JhbVwiKTtcclxuXHJcbi8vIGludGVyZmFjZSBDb250ZXh0IGV4dGVuZHMgV2VjaGF0TWluaXByb2dyYW0uQ2FudmFzQ29udGV4dCB7XHJcbi8vICAgY2FudmFzPzoge1xyXG4vLyAgICAgd2lkdGg6IG51bWJlcixcclxuLy8gICAgIGhlaWdodDogbnVtYmVyXHJcbi8vICAgfVxyXG4vLyB9XHJcblxyXG5sZXQgYW5pOiBsb3R0aWUuQW5pbWF0aW9uO1xyXG5cclxuQ29tcG9uZW50KHtcclxuICBsaWZldGltZXM6IHtcclxuICAgIGNyZWF0ZWQoKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwibG90dGllOiBjcmVhdGVkXCIpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgYXR0YWNoZWQoKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwibG90dGllOiBhdHRhY2hlZFwiKTtcclxuXHJcbiAgICAgIHd4LmNyZWF0ZVNlbGVjdG9yUXVlcnkoKS5pbih0aGlzKS5zZWxlY3QoXCIjY2FudmFzXCIpLm5vZGUocmVzID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhyZXMpO1xyXG5cclxuICAgICAgICBjb25zdCBjYW52YXMgPSByZXMubm9kZTtcclxuICAgICAgICBjb25zb2xlLmxvZyhjYW52YXMpO1xyXG5cclxuICAgICAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcclxuXHJcbiAgICAgICAgY2FudmFzLndpZHRoID0gMiAqIGNhbnZhcy53aWR0aDtcclxuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gMiAqIGNhbnZhcy5oZWlnaHQ7XHJcblxyXG4gICAgICAgIGxvdHRpZS5zZXR1cChjYW52YXMpO1xyXG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHtcclxuICAgICAgICAgIG5hbWU6IFwibG90dGllXCIsXHJcbiAgICAgICAgICBsb29wOiB0cnVlLFxyXG4gICAgICAgICAgYXV0b3BsYXk6IHRydWUsXHJcbiAgICAgICAgICBhbmltYXRpb25EYXRhOiByZXF1aXJlKFwiLi4vLi4vaW1hZ2VzL3NjYW5uaW5nLmpzXCIpLFxyXG4gICAgICAgICAgcmVuZGVyZXJTZXR0aW5nczoge1xyXG4gICAgICAgICAgICBjb250ZXh0XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBhbmkgPSBsb3R0aWUubG9hZEFuaW1hdGlvbihvcHRpb24pO1xyXG4gICAgICB9KS5leGVjKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlYWR5KCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcImxvdHRpZTogcmVhZHlcIik7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBtb3ZlZCgpIHtcclxuICAgICAgY29uc29sZS5sb2coXCJsb3R0aWU6IG1vdmVkXCIpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZGV0YWNoZWQoKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwibG90dGllOiBkZXRhY2hlZFwiKTtcclxuICAgICAgLy8gVE9ETzog5aSa5qyhIGRldGFjaGVkIOWQjiBsb3R0aWUg5bCG5LiN5YaN5Y+v55So77yM55yL6LW35p2l6ZyA6KaBIGxvdHRpZS1taW5pcHJvZ3JhbSDlm6LpmJ/kv67lpI3mn5Dkupvpl67pophcclxuICAgICAgLy8gZGVzdHJveSgpIOaWueazleS4jeWPr+eUqFxyXG4gICAgICBhbmkuc3RvcCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBlcnJvcihlcnIpIHtcclxuICAgICAgY29uc29sZS5sb2coYGxvdHRpZTogZXJyb3IgLSAke2Vycn1gKTtcclxuXHJcbiAgICB9XHJcbiAgfVxyXG59KTsiXX0=