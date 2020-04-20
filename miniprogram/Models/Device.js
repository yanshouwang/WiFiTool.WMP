"use strict";
var Models;
(function (Models) {
    var Device = (function () {
        function Device(Id, Name, SSID) {
            this.Id = Id;
            this.Name = Name;
            this.SSID = SSID;
            this.State = Models.DeviceState.Disconnected;
        }
        Device.prototype.Connect = function (fail) {
            if (this.State !== Models.DeviceState.Disconnected) {
                fail.apply(this);
            }
        };
        Device.prototype.GetAdapters = function () {
        };
        return Device;
    }());
    Models.Device = Device;
})(Models || (Models = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGV2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRGV2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxJQUFVLE1BQU0sQ0F5QmY7QUF6QkQsV0FBVSxNQUFNO0lBQ2Q7UUFJRSxnQkFBbUIsRUFBVSxFQUFTLElBQVksRUFBUyxJQUFZO1lBQXBELE9BQUUsR0FBRixFQUFFLENBQVE7WUFBUyxTQUFJLEdBQUosSUFBSSxDQUFRO1lBQVMsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUZ2RSxVQUFLLEdBQWdCLE9BQUEsV0FBVyxDQUFDLFlBQVksQ0FBQztRQUk5QyxDQUFDO1FBS00sd0JBQU8sR0FBZCxVQUFlLElBQWM7WUFDM0IsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLE9BQUEsV0FBVyxDQUFDLFlBQVksRUFBRTtnQkFDM0MsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNsQjtRQUNILENBQUM7UUFLTSw0QkFBVyxHQUFsQjtRQUVBLENBQUM7UUFDSCxhQUFDO0lBQUQsQ0FBQyxBQXZCRCxJQXVCQztJQXZCWSxhQUFNLFNBdUJsQixDQUFBO0FBQ0gsQ0FBQyxFQXpCUyxNQUFNLEtBQU4sTUFBTSxRQXlCZiIsInNvdXJjZXNDb250ZW50IjpbIm5hbWVzcGFjZSBNb2RlbHMge1xyXG4gIGV4cG9ydCBjbGFzcyBEZXZpY2Uge1xyXG5cclxuICAgIFN0YXRlOiBEZXZpY2VTdGF0ZSA9IERldmljZVN0YXRlLkRpc2Nvbm5lY3RlZDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgSWQ6IHN0cmluZywgcHVibGljIE5hbWU6IHN0cmluZywgcHVibGljIFNTSUQ6IG51bWJlcikge1xyXG5cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbm5lY3RcclxuICAgICAqL1xyXG4gICAgcHVibGljIENvbm5lY3QoZmFpbDogRnVuY3Rpb24pIHtcclxuICAgICAgaWYgKHRoaXMuU3RhdGUgIT09IERldmljZVN0YXRlLkRpc2Nvbm5lY3RlZCkge1xyXG4gICAgICAgIGZhaWwuYXBwbHkodGhpcyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldEFkYXB0ZXJzXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXRBZGFwdGVycygpIHtcclxuXHJcbiAgICB9XHJcbiAgfVxyXG59Il19