<template>
  <div>
    <strong>Browser</strong>
    <feature-table :data="browser" />
    <strong>System</strong>
    <feature-table :data="system" />
    <strong>Relevant Features</strong>
    <feature-table
      :data="relevantFeatures"
      :indicator="Boolean(true)"
    />
    <strong>Nonrelevant Features</strong>
    <feature-table
      :data="nonrelevantFeatures"
      :indicator="Boolean(true)"
    />
  </div>
</template>

<script>
import FeatureTable from '@/components/molecules/FeatureTable';

// const pick = (...props) => o => props.reduce((a, e) => ({ ...a, [e]: o[e] }), {});
const pick = (obj, ...keys) => Object.fromEntries(
  Object.entries(obj)
    .filter(([key]) => keys.includes(key))
);
const systemProps = [
  'osName',
  'osVersion',
  'isMobileDevice',
  'displayResolution',
  'displayAspectRatio'
];

const relevantFeatureProps = [
  'hasMicrophone',
  'isWebsiteHasMicrophonePermissions',
  'hasSpeakers',
  'hasWebcam',
  'isWebsiteHasWebcamPermissions',
  'isWebRTCSupported',
  'isCreateMediaStreamSourceSupported',
  'isAudioContextSupported',
  'isRtpDataChannelsSupported',
  'isSctpDataChannelsSupported',
  'isGetUserMediaSupported',
  'isCanvasSupportsStreamCapturing',
  'isVideoSupportsStreamCapturing',
  'isPromisesSupported'
];

const nonrelevantFeatureProps = [
  'isORTCSupported',
  'isScreenCapturingSupported',
  'isWebSocketsSupported',
  'isWebSocketsBlocked',
  'isSetSinkIdSupported',
  'isRTPSenderReplaceTracksSupported',
  'isRemoteStreamProcessingSupported',
  'isApplyConstraintsSupported',
  'isMultiMonitorScreenCapturingSupported'
];

export default {
  components: {
    FeatureTable
  },

  props: {
    data: {
      type: Object,
      default () {
        return {};
      }
    }
  },

  computed: {
    browser () {
      return this.data.browser;
    },

    system () {
      return pick(this.data, ...systemProps);
    },

    relevantFeatures () {
      return pick(this.data, ...relevantFeatureProps);
    },

    nonrelevantFeatures () {
      return pick(this.data, ...nonrelevantFeatureProps);
    }
  }

};
</script>

<style lang="postcss" scoped>
</style>
