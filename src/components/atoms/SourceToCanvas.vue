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
    this.worker = new Worker(require('worker-loader!@/worker/orb.js'), 1);
    this.contextInput = this.$refs.input.getContext('2d');
    this.contextOutput = this.$refs.output.getContext('2d');
    this.imageData = new ImageData(this.width, this.height);

    this.worker.ready(async () => {
      const img = await loadImage();
      this.$refs.input.width = img.width;
      this.$refs.input.height = img.height;
      this.contextInput.drawImage(img, 0, 0, img.width, img.height);
      // setTimeout(() => {
      const image = this.contextInput.getImageData(0, 0, img.width, img.height);
      process(this.worker, image, 'setup')
        .then((data) => {
          console.log('AHA', data);
          this.$refs.output.width = data.width;
          this.$refs.output.height = data.height;
          this.contextOutput.putImageData(data, 0, 0);
          return data;
        })
        .catch((e) => {
          console.error(e.toString());
        });
      // }, 100);
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
  this.$refs.input.width = this.width;
  this.$refs.input.height = this.height;
  this.contextInput.drawImage(this.source, 0, 0, this.width, this.height);

  this.$refs.output.width = this.imageData.width;
  this.$refs.output.height = this.imageData.height;
  this.contextOutput.putImageData(this.imageData, 0, 0);
  setTimeout(this.processImageData, 0);
}

async function process (worker, image, type = 'process') {
  const { data } = await worker.process({
    type: type,
    data: image
  }, [image.data.buffer]);
  return data;
}

function loadImage (url = '/IMG_1825_small.JPG') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
</script>

<style lang="postcss" scoped>
canvas {
  position: absolute;
  width: 100%;
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
