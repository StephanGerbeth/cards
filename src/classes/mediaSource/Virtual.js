export default class VirtualSource {
  constructor(...sources) {
    this.sources = sources;
  }

  async getStream (audio = true) {
    const tracks = await this.sources.reduce(async (resultPromise, source) => {
      const result = await resultPromise;
      const tracks = (await source.getStream(audio)).getTracks();
      return result.concat(tracks);
    }, Promise.resolve([]));
    return new MediaStream(tracks);
  }

  destroy () {
    this.sources.map((source) => {
      source.destroy();
      return null;
    });
  }
}
