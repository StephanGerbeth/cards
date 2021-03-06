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
    <div class="stream-container">
      <stream-controller
        :stream="srcObject"
        :master="!!key"
        mode="remote"
      />
      <stream-controller
        :stream="srcObjectLocal"
        :master="!!key"
        mode="local"
      />
    </div>
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
    <strong>Local Video</strong>
    <select @change="switchCamLocal">
      <option value="">
        default
      </option>
      <option
        v-for="(capability, index) in availableCapabilitiesLocal"
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
import StreamController from '@/components/molecules/StreamController';
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
    StreamController,
    BrowserInfo
  },

  data () {
    return {
      srcObject: null,
      srcObjectLocal: null,
      generatedKey: null,
      connection: null,
      connected: false,
      loading: false,
      availableCapabilitiesLocal: [],
      currentCapabilitiesLocal: [],
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
    this.availableCapabilitiesLocal = await cam.getAvailableCapabilities();
    console.log(this.availableCapabilitiesLocal);
    this.connect(cam);
  },

  destroyed () {
    try {
      this.connection.destroy();
    }
    catch (e) { return; }
    finally {
      this.connection = null;
    }
  },

  methods: {
    getType (type) {
      return (this.key && type == 'remote') || (!this.key && type === 'local');
    },

    async connect (mediaSource) {
      let interval = null;
      this.connection = new Connection();

      this.connection.setup.get('key').subscribe((key) => {
        this.generatedKey = key;
      });

      this.connection.status.get('open').subscribe(() => {
        this.connected = true;

        interval = setInterval(() => {
          this.connection.channels.get('test').publish({ text: 'hello world' });
        }, 2000);
      });

      this.connection.browser.get('local').subscribe((info) => {
        console.log('-> controller: local info', info);
      });

      this.connection.browser.get('remote').subscribe((info) => {
        console.log('-> controller: remote info', info);
        this.remoteBrowserInfo = info;
      });

      this.connection.stream.get('local').subscribe((stream) => {
        console.log('-> controller: change local stream');
        this.srcObjectLocal = stream;
      });

      this.connection.stream.get('remote').subscribe(async (stream) => {
        console.log('-> controller: add remote stream', stream.getTracks());
        this.srcObject = stream;
      });

      this.connection.channels.get('test').subscribe((data) => {
        console.log('-> controller: received data', data);
      });

      this.connection.status.get('close').subscribe(() => {
        this.connected = false;
        clearInterval(interval);
        this.connection = null;

        if (!this.key) {
          this.connect(mediaSource);
        }
      });

      this.connection.open(mediaSource, this.key);
    },

    disconnect () {
      this.connection.close();
    },

    async showCamSource () {
      this.connection.addSource(new Cam());
    },

    async showVideoSource () {
      this.connection.addSource(new SourceToCanvas(new Video({ url: '/video/test.mp4' })));
    },

    async showTestScreen () {
      this.connection.addSource(new Virtual(new TestImage(), new SineAudio()));
    },

    mute () {
      this.connection.mute();
    },

    async switchCamLocal (e) {
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
      console.log('-> controller: constraints local', constraints);
      this.connection.addSource(new Cam(constraints));
    },

    isCurrentCapability (capability) {
      return this.currentCapabilitiesLocal.filter((c) => c.deviceId === capability.deviceId).length > 0;
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

.stream-container {
  position: relative;
}
</style>
