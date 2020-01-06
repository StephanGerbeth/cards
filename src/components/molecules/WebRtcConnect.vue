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
        :disabled="isCurrentCapability(capability)"
      >
        {{ capability.label }}
      </option>
    </select>
    <browserInfo :data="remoteBrowserInfo" />
  </div>
</template>

<script>
import Connection from '@/classes/Connection';
import QrCode from '@/components/atoms/QrCode';
import Virtual from '@/classes/mediaSource/Virtual';
import Cam from '@/classes/mediaSource/Cam';
import Video from '@/classes/mediaSource/Video';
import SourceToCanvas from '@/classes/mediaSource/SourceToCanvas';
import SineAudio from '@/classes/mediaSource/SineAudio';
import TestImage from '@/classes/mediaSource/TestImage';
import BrowserInfo from '@/components/organisms/BrowserInfo';

export default {
  components: {
    QrCode,
    BrowserInfo
  },

  data () {
    return {
      srcObject: null,
      generatedKey: null,
      connection: null,
      connected: false,
      loading: false,
      availableCapabilities: [],
      currentCapabilities: [],
      remoteBrowserInfo: {}
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

    this.connect(cam);
  },

  destroyed () {
    this.connection.destroy();
  },

  methods: {
    async connect (mediaSource) {
      this.connection = new Connection(this.key);

      this.connection.subscribe('key', (key) => {
        this.generatedKey = key;
      });

      this.connection.subscribe('info', (info) => {
        console.log('-> controller: remote info', info);
        this.remoteBrowserInfo = info;
      });

      this.connection.subscribe('stream-remote', async (stream) => {
        console.log('-> controller: add remote stream', stream.getTracks());
        this.srcObject = stream;
      });

      this.connection.subscribe('stream-local', (capabilities) => {
        console.log('-> controller: change local stream');
        this.currentCapabilities = capabilities;
      });

      this.connection.subscribe('open', () => {
        this.connected = true;
      });

      this.connection.subscribe('close', () => {
        this.connected = false;
      });

      this.connection.open(mediaSource);
    },

    disconnect () {
      this.connection.close();
    },

    async showCamSource () {
      this.connection.addSource(new SourceToCanvas(new Cam()));
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
