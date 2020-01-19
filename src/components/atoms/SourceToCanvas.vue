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
import Worker from '@/classes/Worker';

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
    this.worker = new Worker(require('worker-loader!@/worker/grayscale.js'), 1);
    this.contextInput = this.$refs.input.getContext('2d');
    this.contextOutput = this.$refs.output.getContext('2d');
    this.loop = loopByFPS(this.fps, update.bind(this));

    this.worker.ready(() => {
      this.loop.start();
    });
  },

  destroyed () {
    this.loop.stop();
    this.drawProcess.stop();
    this.worker.destroy();
  },

  methods: {
    async updateDebugCanvas (imageData) {
      const { data } = await imageData;
      this.drawProcess.stop();
      this.drawProcess = draw(() => {
        this.contextOutput.putImageData(new ImageData(data, this.width, this.height), 0, 0);
      });
    }
  }
};

function update () {
  this.contextInput.drawImage(this.source, 0, 0, this.width, this.height);
  if (this.worker.isIdle()) {
    const image = this.contextInput.getImageData(0, 0, this.width, this.height).data;
    try {
      const data = process(this.worker, image, this.width, this.height);
      this.updateDebugCanvas(data);
    } catch (e) {
      console.error(e.toString());
    }
  }
}

async function process (worker, image, width, height) {
  const { data } = await worker.process({
    type: 'image',
    data: {
      image: image,
      width: width,
      height: height
    }
  }, [image.buffer]);
  return data;
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
