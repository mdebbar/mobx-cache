import { action, observable } from "mobx";
// 3. Decouple the cache from the store.

export default class MobxCache {
  _status = {};
  @observable _cache = asMap({});

  constructor(options) {
    this.options = options;
  }

  // Try to find the data in the cache. If it's not there, it will be fetched from the server.
  get(key) {
    this._maybeCacheMiss(key);
    return this.peek(key);
  }

  // Get whatever is in the cache. No server request.
  peek(key) {
    return this._cache.get(key);
  }

  _maybeCacheMiss(key) {
    if (!this._status[key]) {
      // Cache miss!
      this._status[key] = LOADING;
      this.options.onMiss(key).then(data => {
        this._status[key] = SUCCESS;
        const processData = this.options.processData || x => x;
        this._populateCache(key, processData(data));
      });
    }
  }

  @action _populateCache(key, data) {
    this._cache.set(key, data);
  }
}
