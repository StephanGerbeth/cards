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

  watch: {
    'url': {
      handler () {
        this.createQRCode();
      }
    }
  },

  async mounted () {
    this.createQRCode();
  },

  methods: {
    async createQRCode () {
      this.qrCodeUrl = await QRCode.toDataURL(this.url, { errorCorrectionLevel: 'L' });
    }
  }
};
</script>

<style lang="postcss" scoped>
</style>
