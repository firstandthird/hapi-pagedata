module.exports = function(key, data, done) {
  this.cache.set(key, data, 0, done);
};
