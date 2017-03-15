'use strict';
const Hoek = require('hoek');
module.exports = function(server, config) {
  return [
    {
      method: 'POST',
      path: config.hookEndpoint,
      handler(request, reply) {
        const payload = request.payload;

        if (payload.event && payload.event === 'ping') {
          return reply('pong');
        }

        if ((config.tag && !payload.tags) || (config.tag && payload.tags.indexOf(config.tag) === -1)) {
          //tags don't match
          server.log(['pagedata', 'pagedata-hook', 'info'], { message: 'cache hook skipped', id: payload.slug, serverTag: config.tag, pageTags: payload.tags });
          return reply('skipped');
        }
        server.methods.pageData.set(payload.slug, payload.content, (err) => {
          if (err) {
            server.log(['pagedata', 'pagedata-hook', 'error'], { message: 'Error setting cache', error: err });
            return;
          }
          server.log(['pagedata', 'pagedata-hook'], { message: 'Cache updated', id: payload.slug });
          if (config.hookSuccessMethod) {
            const method = Hoek.reach(server.methods, config.hookSuccessMethod);
            if (!method) {
              server.log(['pagedata', 'pagedata-hook', 'error'], `${config.hookSuccessMethod} doesn't exist`);
            } else {
              method(payload.slug, payload.tags);
            }
          }
        });
        reply('ok');
      }
    }
  ];
};
