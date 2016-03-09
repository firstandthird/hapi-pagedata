module.exports = function(id, done) {
  this.cache.get({ id }, done);
};
