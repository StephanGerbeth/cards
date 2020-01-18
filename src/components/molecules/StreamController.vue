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
    <source-to-canvas
      v-if="video"
      :source="video"
      :fps="Number(60)"
    />
  </div>
</template>

<script>
import SourceToCanvas from '@/components/atoms/SourceToCanvas';

global.MediaStream = global.MediaStream || Object;

export default {
  components: {
    SourceToCanvas
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
      console.log('PLAYING');
      this.video = e.target;
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
