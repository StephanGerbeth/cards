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
import { addToAnimationFrame } from '@/utils/animationFrame';
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
      imageData: null
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
    this.imageData = new ImageData(this.width, this.height);

    this.worker.ready(() => {
      console.log('-> SourceToCanvas: start webworker process');
      this.aF = addToAnimationFrame(update.bind(this));
    });
  },

  destroyed () {
    this.aF.destroy();
    this.worker.destroy();
  },

  methods: {
    processImageData () {
      if (this.worker.isIdle()) {
        const image = this.contextInput.getImageData(0, 0, this.width, this.height);
        process(this.worker, image)
          .then((data) => {
            this.imageData = data;
            return data;
          })
          .catch((e) => {
            console.error(e.toString());
          });
      }
    }
  }
};

function update () {
  this.contextInput.drawImage(this.source, 0, 0, this.width, this.height);
  this.contextOutput.putImageData(this.imageData, 0, 0);
  setTimeout(this.processImageData, 0);
}

async function process (worker, image) {
  const { data } = await worker.process({
    type: 'image',
    data: image
  }, [image.data.buffer]);
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
    display: none;
    transform-origin: top left;
  }

  &.output {
    top: 0;
    right: 0;
    transform-origin: top right;
  }
}
</style>
