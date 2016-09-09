import { action, asMap, observable } from 'mobx'

const emptyFn = () => (void 0)
const identityFn = x => x

export default class MobxCache {
  _status = {};
  @observable _cache = asMap({});

  /**
   * @onMiss: function that returns a promise resolving into the value to be inserted in the cache.
   * @options:
   * - processData: function to process data after it's received from onMiss().
   */
  constructor(onMiss, options) {
    this.onMiss = onMiss || emptyFn
    this.options = options || {}
  }

  // Try to find the data in the cache. If it's not there, it will be fetched from the server.
  get(key) {
    this._maybeCacheMiss(key)
    return this.peek(key)
  }

  // Get whatever is in the cache. No server request.
  peek(key) {
    return this._cache.get(key)
  }

  _maybeCacheMiss(key) {
    if (!this._status[key]) {
      // Cache miss!
      this._status[key] = 'loading'
      this.onMiss(key).then(data => {
        this._status[key] = 'success'
        const processData = this.options.processData || identityFn
        this._populate(key, processData(data))
      })
    }
  }

  @action _populate(key, data) {
    this._cache.set(key, data)
  }
}
