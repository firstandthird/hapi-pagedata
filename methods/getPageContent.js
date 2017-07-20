module.exports = function(server, api, config) {
  server.method('pagedata.getPageContent', (slug, done) => {
    server.methods.pagedata.getPage(slug, (err, page) => {
      if (err) {
        return done(err);
      }
      return done(null, page.content);
    });
  });
};
