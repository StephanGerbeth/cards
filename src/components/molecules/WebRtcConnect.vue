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
    <select @change="switchCam">
      <option value="">
        default
      </option>
      <option
        v-for="(capability, index) in availableCapabilities"
        :key="index"
        :value="capability.deviceId"
      >
        {{ capability.label }}
      </option>
    </select>
  </div>
</template>

<script>
// :disabled="isCurrentCapability(capability)"
import Connection from '@/classes/Connection';
import QrCode from '@/components/atoms/QrCode';
import { fromEvent } from 'rxjs';
import DetectRTC from 'detectrtc';
import Virtual from '@/classes/mediaSource/Virtual';
import Cam from '@/classes/mediaSource/Cam';
import Video from '@/classes/mediaSource/Video';
import SourceToCanvas from '@/classes/mediaSource/SourceToCanvas';
import SineAudio from '@/classes/mediaSource/SineAudio';
import TestImage from '@/classes/mediaSource/TestImage';

export default {
  components: {
    QrCode
  },

  data () {
    return {
      srcObject: null,
      generatedKey: null,
      connection: null,
      connected: false,
      loading: false,
      availableCapabilities: [],
      currentCapabilities: []
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

    const cam = new Cam();
    this.availableCapabilities = await cam.getAvailableCapabilities();
    console.log(this.availableCapabilities);

    DetectRTC.load(() => {
      this.connect(cam, DetectRTC);
    });
  },

  destroyed () {
    this.connection.destroy();
  },

  methods: {
    async connect (mediaSource, support) {
      this.connection = new Connection(this.key, support);
      // this.connection.key.subsribe(() => {

      // })
      fromEvent(this.connection, 'key').subscribe((key) => {
        this.generatedKey = key;
      });

      fromEvent(this.connection, 'remote:info').subscribe((info) => {
        console.log('-> controller: remote info', info);
      });

      fromEvent(this.connection, 'stream').subscribe(async (stream) => {
        console.log('-> controller: add remote stream', stream.getTracks());
        this.srcObject = stream;
      });

      fromEvent(this.connection, 'stream:change').subscribe(async (capabilities) => {
        console.log('-> controller: change local stream');
        this.currentCapabilities = capabilities;
      });

      fromEvent(this.connection, 'open').subscribe((/*peer*/) => {
        this.connected = true;
        // this.connection.send('useragent:remote', );
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

      this.connection.open(mediaSource);
    },

    disconnect () {
      this.connection.destroy();
    },

    async showCamSource () {
      this.connection.addSource(new Cam());
    },

    async showVideoSource () {
      this.connection.addSource(new SourceToCanvas(new Video('/video/test.mp4')));
    },

    async showTestScreen () {
      this.connection.addSource(new Virtual(new TestImage(), new SineAudio()));
    },

    mute () {
      this.connection.mute();
    },

    switchCam (e) {
      console.log('-> controller: switch to', e.target.value);
      const constraints = {
        video: {
          deviceId: {
            exact: e.target.value
          }
        }, audio: {
          autoGainControl: true,
          channelCount: 2,
          echoCancellation: true,
          latency: 0,
          noiseSuppression: true,
          sampleRate: 48000,
          sampleSize: 16,
          volume: 1.0
        }
      };
      console.log('-> controller: constraints', constraints);
      this.connection.addSource(new Cam(constraints));
    },

    isCurrentCapability (capability) {
      return this.currentCapabilities.filter((c) => c.deviceId === capability.deviceId).length > 0;
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
