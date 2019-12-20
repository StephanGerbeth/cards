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
import { fromEvent } from 'rxjs';

export default {
  components: {
    QrCode
  },

  data () {
    return {
      generatedKey: null,
      connection: null,
      connected: false,
      loading: false
    };
  },

  computed: {
    key: function () {
      return this.$router.currentRoute.query.key;
    },
    url () {
      if (global.location) {
        return `${global.location.origin}/?key=${this.generatedKey}`;
      }
      return null;
    }
  },

  mounted () {
    this.connect();
  },

  destroyed () {
    this.connection.destroy();
  },

  methods: {
    connect () {
      this.connection = new Connection(this.key);
      this.connection.open();
      fromEvent(this.connection, 'key').subscribe((key) => {
        this.generatedKey = key;
      });
      fromEvent(this.connection, 'open').subscribe((peer) => {
        this.connected = true;
        fromEvent(peer, 'data').subscribe(([
          data
        ]) => {
          console.log(data);
        });
        let count = 0;
        setInterval(() => {
          peer.send(`hello ${count++}.`);
        }, 1000);
      });
      fromEvent(this.connection, 'close').subscribe(() => {
        this.connected = false;
      });
    },

    disconnect () {
      this.connection.destroy();
      this.connection = null;
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
