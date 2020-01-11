<template>
  <div>
    <video-stream :stream="stream" />
    <select @change="switchCamLocal">
      <option value="">
        default
      </option>
      <option
        v-for="(capability, index) in availableCapabilitiesLocal"
        :key="index"
        :value="capability.deviceId"
        :disabled="isCurrentCapability(capability)"
      >
        {{ capability.label }}
      </option>
    </select>
  </div>
</template>

<script>
import VideoStream from '@/components/atoms/VideoStream';

export default {
  components: {
    VideoStream
  },

  props: {
    connection: {
      type: Object,
      default () {
        return null;
      }
    }
  },

  data () {
    return {
      stream: null,
      videoInputDevices: []
    };
  },

  mounted () {
    this.connection.subscribe('info', (info) => {
      console.log('-> controller: remote info', info);
      this.videoInputDevices = info.videoInputDevices;
    });

    this.connection.subscribe('stream-remote', async (stream) => {
      console.log('-> controller: add remote stream', stream.getTracks());
      this.stream = stream;
    });
  }
};
</script>

<style lang="postcss" scoped>
</style>
