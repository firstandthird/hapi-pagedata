'use strict';
module.exports = function(site, id, tag, done) {
  if (typeof tag === 'function') {
    done = tag;
    tag = '';
  }
  this.cache.get({ site, id, tag }, done);
};
