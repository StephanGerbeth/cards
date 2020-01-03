export function muteAudio (stream) {
  stream.getAudioTracks().forEach((track) => {
    track.stop();
  });
  return stream;
}
