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
      ref="video"
      :srcObject.prop="srcObject"
      autoplay
      playsinline
      width="640"
      height="480"
    />
    <!-- <video
      ref="test"
      src="/video/test.mp4"
      autoplay
      playsinline
      muted
      loop
    /> -->
    <button @click="showCamSource">
      Cam
    </button>
    <button @click="showVideoSource">
      Video
    </button>
    <button @click="showTestScreen">
      TestScreen
    </button>
    <button @click="mute">
      Mute
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
    console.log('MOUNTED');
    this.connect(this.mediaSource.cam());
  },

  destroyed () {
    this.connection.destroy();
  },

  methods: {
    async connect (mediaStream) {
      this.connection = new Connection(this.key);

      fromEvent(this.connection, 'key').subscribe((key) => {
        this.generatedKey = key;
      });

      fromEvent(this.connection, 'stream').subscribe(async (stream) => {
        console.log('-> controller: add remote stream', stream.getTracks());
        this.srcObject = stream;
      });

      fromEvent(this.connection, 'open').subscribe((/*peer*/) => {
        this.connected = true;
        // this.connection.addStream(this.mediaSource.cam());
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

      this.connection.open(mediaStream);
    },

    disconnect () {
      this.connection.destroy();
    },

    async showCamSource () {
      this.connection.addStream(this.mediaSource.cam());
    },

    async showVideoSource () {
      this.connection.addStream(this.mediaSource.video());
    },

    async showTestScreen () {
      this.connection.addStream(this.mediaSource.test());
    },

    mute () {
      this.connection.muteStream();
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
