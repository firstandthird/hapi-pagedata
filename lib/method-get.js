'use strict';
module.exports = function(id, tag, done) {
  if (typeof tag === 'function') {
    done = tag;
    tag = '';
  }
  this.cache.get({ id, tag }, done);
};
