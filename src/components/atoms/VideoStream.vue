<template>
  <video
    ref="video"
    :srcObject.prop="stream"
    autoplay
    playsinline
    width="640"
    height="480"
  />
</template>

<script>
export default {
  props: {
    stream: {
      type: Object,
      default () {
        return null;
      }
    }
  }
};
</script>

<style lang="postcss" scoped>
</style>
