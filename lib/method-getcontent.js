'use strict';
module.exports = function(slug, tag, done) {
  const server = this.server;
  if (typeof tag === 'function') {
    done = tag;
    tag = '';
  }
  server.methods.pagedata.getPage(slug, tag, (err, page) => {
    if (err) {
      server.log(['pagedata', 'error'], { page: slug, tag, error: err.message || err.toString() });
      return done(err);
    }
    return done(null, page.content);
  });
};
