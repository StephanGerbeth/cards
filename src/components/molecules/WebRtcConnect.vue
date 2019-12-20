<template>
  <div>
    <div v-if="!connected">
      waiting for client...
    </div>
    <div v-if="loading">
      loading stream ...
    </div>

    <qr-code
      v-if="url && !key"
      :url="url"
    />

    <label class="status">
      Connected <span :class="{ active: connected }" />
    </label>
    <button
      v-if="connected"
      @click="disconnect"
    >
      HangUp!
    </button>
  </div>
</template>

<script>
import Connection from '@/classes/Connection';
import QrCode from '@/components/atoms/QrCode';

export default {
  components: {
    QrCode
  },

  data () {
    return {
      url: null,
      webrtc: null,
      connected: false,
      loading: false
    };
  },

  computed: {
    key: function () {
      return this.$router.currentRoute.query.key;
    }
  },

  mounted () {
    this.connect();
  },

  destroyed () {
    this.disconnect();
  },

  methods: {
    async connect () {
      this.webrtc = new Connection(this.key);
      this.url = await this.webrtc.prepare();
      const peer = await this.webrtc.connect();
      this.connected = true;
      console.log(peer);
      await this.webrtc.onDisconnect();
      this.webrtc.destroy();
      this.webrtc = null;
      Object.assign(this.$data, this.$options.data.call(this));
      this.connect();
    },

    disconnect () {
      this.webrtc.disconnect();
    }
  }
};
</script>

<style lang="postcss" scoped>
.status {
  & span {
    display: inline-block;
    width: 10px;
    height: 10px;
    background-color: red;

    &.active {
      background-color: green;
    }
  }
}
</style>
