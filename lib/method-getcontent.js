'use strict';
module.exports = function(slug, tag, done) {
  const server = this.server;
  if (typeof tag === 'function') {
    done = tag;
    tag = '';
  }
  server.methods.pagedata.getPage(slug, tag, (err, page) => {
    if (err) {
      return done(err);
    }
    return done(null, page.content);
  });
};
