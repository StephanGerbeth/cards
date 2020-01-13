<template>
  <div :class="{small: type}">
    <video
      :srcObject.prop="stream"
      autoplay
      playsinline
      muted
      loop
      @playing="onPlaying"
    />
    <canvas-video
      v-if="video"
      :source="video"
      :fps="Number(10)"
    />
  </div>
</template>

<script>
import CanvasVideo from '@/components/atoms/CanvasVideo';

global.MediaStream = global.MediaStream || Object;

export default {
  components: {
    CanvasVideo
  },

  props: {
    stream: {
      type: MediaStream,
      default () {
        return null;
      }
    },
    mode: {
      type: String,
      default () {
        return 'local';
      }
    },
    master: {
      type: Boolean,
      default () {
        return false;
      }
    }
  },

  data () {
    return {
      video: null
    };
  },

  computed: {
    type () {
      return (this.master && this.mode == 'remote') || (!this.master && this.mode === 'local');
    },
  },

  methods: {
    onPlaying (e) {
      this.video = e.target;
      console.log('PLAYING', e);

    }
  }
};
</script>

<style lang="postcss" scoped>
video {
  display: block;
  width: 100%;
  height: auto;
}

.small {
  position: absolute;
  right: 0;
  bottom: 0;
  transform: scale(0.5);
  transform-origin: bottom right;
}
</style>
