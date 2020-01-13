<template>
  <canvas />
</template>

<script>
import { loopByFPS } from '@/utils/animationFrame';

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

  mounted () {
    this.context = this.$el.getContext('2d');
    this.loop = loopByFPS(this.fps, update.bind(this));
    this.loop.start();
  }
};

function update () {
  this.$el.width = this.source.videoWidth;
  this.$el.height = this.source.videoHeight;
  this.context.drawImage(this.source, 0, 0);
  this.context.getImageData(0, 0, this.source.videoWidth, this.source.videoHeight);
}
</script>

<style lang="postcss" scoped>
canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: scale(0.5);
  transform-origin: top left;
}
</style>
