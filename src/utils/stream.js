let audioStream = null;

export function muteAudio (stream) {
  stream.getAudioTracks().forEach((track) => {
    track.stop();
  });
}

export function addSilentStream (stream) {
  if (!stream.getAudioTracks().length) {
    if (!audioStream) {
      const AudioContext = global.AudioContext || global.webkitAudioContext;
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const destination = oscillator.connect(audioContext.createMediaStreamDestination());
      oscillator.start();
      audioStream = destination.stream;
    }

    audioStream.getAudioTracks().forEach((track) => {
      stream.addTrack(Object.assign(track, { enabled: false }));
    });
  }
}
