import Base from '@/classes/mediaSource/Base';

export default class VirtualSource extends Base {
  constructor(...sources) {
    super();
    this.sources = sources;
  }

  async getStream (audio = true) {
    const tracks = await this.sources.reduce(async (resultPromise, source) => {
      const result = await resultPromise;
      const tracks = (await source.getStream(audio)).getTracks();
      return result.concat(tracks);
    }, Promise.resolve([]));
    return super.prepareStream(new MediaStream(tracks), audio);
  }

  destroy () {
    super.destroy();
    this.sources.map((source) => {
      source.destroy();
      return null;
    });
  }
}
