<template>
  <div class="game">
    hello
    <web-rtc-connect />
  </div>
</template>

<script>
// import WebRTC from '@/classes/WebRTC';
import WebRtcConnect from '@/components/molecules/WebRtcConnect';

export default {
  components: {
    WebRtcConnect
  },

  mounted () {
    // const webrtc = new WebRTC();
    // webrtc.connect();
  }
};
</script>

<style lang="postcss" scoped>
.game {
  width: 100%;
  height: 100vh;
}
</style>
