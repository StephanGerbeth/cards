<template>
  <a
    :href="url"
    target="_blank"
  >
    <img :src="qrCodeUrl">
  </a>
</template>

<script>
import QRCode from 'qrcode';

export default {
  props: {
    url: {
      type: String,
      default () {
        return '';
      }
    }
  },

  data () {
    return {
      qrCodeUrl: ''
    };
  },

  async mounted () {
    this.qrCodeUrl = await QRCode.toDataURL(this.url, { errorCorrectionLevel: 'L' });
  }
};
</script>

<style lang="postcss" scoped>
</style>
