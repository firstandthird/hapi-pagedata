const async = require('async');
module.exports = function(server, config) {
  return [
    {
      method: 'POST',
      path: config.hookEndpoint,
      handler(request, reply) {
        const payload = request.payload;
        server.methods.pageData.set(payload.slug, payload.content, (err) => {
          if (err) {
            server.log(['pagedata', 'pagedata-hook', 'error'], { message: 'Error setting cache', error: err });
          } else {
            server.log(['pagedata', 'pagedata-hook'], { message: 'Cache updated', id: payload.slug });
          }
        });
        reply('ok');
      }
    }
  ];
};
