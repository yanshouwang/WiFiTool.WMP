Component({
  data: {
    hide: true
  },

  properties: {
    title: String
  },

  methods: {
    onTap() {
      const data: Record<string, any> = {};
      data["hide"] = !this.data.hide;
      this.setData(data);
    }
  }
});