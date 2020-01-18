<template>
  <div>
    <canvas
      ref="input"
      :width="width"
      :height="height"
      class="input"
    />
    <canvas
      ref="output"
      :width="width"
      :height="height"
      class="output"
    />
  </div>
</template>

<script>
import { loopByFPS, draw } from '@/utils/animationFrame';

global.HTMLVideoElement = global.HTMLVideoElement || Object;

export default {
  props: {
    source: {
      type: HTMLVideoElement,
      default () {
        return null;
      }
    },

    fps: {
      type: Number,
      default () {
        return 60;
      }
    }
  },

  data () {
    return {
      drawProcess: draw()
    };
  },

  computed: {
    width () {
      return this.source.videoWidth / 2;
    },

    height () {
      return this.source.videoHeight / 2;
    }
  },

  async mounted () {
    this.worker = new require('worker-loader!@/worker/grayscale.js')();
    this.contextInput = this.$refs.input.getContext('2d');
    this.contextOutput = this.$refs.output.getContext('2d');
    this.loop = loopByFPS(this.fps, update.bind(this));

    this.worker.addEventListener('message', this.onMessage);
  },

  methods: {
    onMessage (e) {
      if (e.data.type === 'status') {
        this.loop.start();
      }
      if (e.data.type === 'image') {
        this.updateDebugCanvas(e.data);
      }
    },

    updateDebugCanvas (imageData) {
      this.drawProcess.stop();
      this.drawProcess = draw(() => {
        this.contextOutput.putImageData(new ImageData(imageData.data, this.width, this.height), 0, 0);
      });
    }
  }
};

function update () {
  this.contextInput.drawImage(this.source, 0, 0, this.width, this.height);
  const data = this.contextInput.getImageData(0, 0, this.width, this.height).data;
  this.worker.postMessage({
    type: 'image',
    imageData: {
      data: data,
      width: this.width,
      height: this.height
    }
  }, [data.buffer]);
}
</script>

<style lang="postcss" scoped>
canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: scale(0.5);

  &.input {
    top: 0;
    left: 0;
    transform-origin: top left;
  }

  &.output {
    top: 0;
    right: 0;
    transform-origin: top right;
  }
}
</style>
