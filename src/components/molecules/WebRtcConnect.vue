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
    <video
      :srcObject.prop="srcObject"
      autoplay
      playsinline
      muted
      width="640"
      height="480"
    />
    <video
      ref="test"
      src="/video/test.mp4"
      autoplay
      playsinline
      muted
      loop
    />
    <button @click="changeSource">
      Change
    </button>
  </div>
</template>

<script>
import Connection from '@/classes/Connection';
import MediaSource from '@/classes/MediaSource';
import QrCode from '@/components/atoms/QrCode';
import { fromEvent } from 'rxjs';

export default {
  components: {
    QrCode
  },

  data () {
    return {
      mediaSource: new MediaSource(),
      srcObject: null,
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

  async mounted () {
    const mediaStream = await this.mediaSource.getUserMediaStream();
    console.log(mediaStream.getTracks());
    this.connect(mediaStream);
  },

  destroyed () {
    this.connection.destroy();
  },

  methods: {
    async connect (mediaStream) {
      this.connection = new Connection(this.key);
      this.connection.open(mediaStream);
      fromEvent(this.connection, 'key').subscribe((key) => {
        this.generatedKey = key;
      });
      fromEvent(this.connection, 'stream').subscribe(async ([
        data
      ]) => {
        console.log('STREAM', data);
        this.srcObject = data;
      });
      fromEvent(this.connection, 'open').subscribe((/*peer*/) => {
        this.connected = true;

        // fromEvent(peer, 'data').subscribe(([
        //   data
        // ]) => {
        //   console.log(data);
        // });
        // let count = 0;
        // setInterval(() => {
        //   peer.send(`hello ${count++}.`);
        // }, 1000);
      });
      fromEvent(this.connection, 'close').subscribe(() => {
        this.connected = false;
      });
    },

    disconnect () {
      this.connection.destroy();
    },

    async changeSource () {

      const stream = await this.mediaSource.getBlackSilenceStream();
      // // const video = stream.getVideoTracks();
      this.connection.replaceTracks(stream);
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
