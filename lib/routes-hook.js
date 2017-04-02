'use strict';
const Hoek = require('hoek');
const async = require('async');
module.exports = function(server, config, cache) {
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
          server.log(['pagedata', 'pagedata-hook', 'info'], { message: 'cache hook skipped', slug: payload.slug, serverTag: config.tag, pageTags: payload.tags });
          return reply('skipped');
        }

        async.autoInject({
          drop(done) {
            server.methods.pagedata.getPage.cache.drop(payload.slug, done);
          },
          get(drop, done) {
            server.methods.pagedata.getPage(payload.slug, done);
          },
          dropPages(get, done) {
            const page = get[0];
            //only cache on the collection level
            if (!page.collectionId) {
              return done();
            }
            server.methods.pagedata.getPages.cache.drop(page.site.slug, page.collectionId, done);
          },
          getPages(get, dropPages, done) {
            const page = get[0];
            //only cache on the collection level
            if (!page.collectionId) {
              return done();
            }
            server.methods.pagedata.getPages(page.site.slug, page.collectionId, done);
          },
          hook(get, getPages, done) {
            if (config.hookSuccessMethod) {
              const method = Hoek.reach(server.methods, config.hookSuccessMethod);
              if (!method) {
                server.log(['pagedata', 'pagedata-hook', 'error'], `${config.hookSuccessMethod} doesn't exist`);
              } else {
                method(payload.slug, payload.tags);
              }
            }
            done();
          }
        }, (err, results) => {
          if (err) {
            server.log(['pagedata', 'pagedata-hook', 'error'], err);
            return;
          }
          const page = results.get[0];
          server.log(['pagedata', 'pagedata-hook'], {
            message: 'Cache updated',
            slug: page.slug,
            tags: payload.tags,
            serverTag: config.tag,
            site: page.site.slug,
            collectionId: page.collectionId
          });
        });

        reply('ok');
      }
    }
  ];
};
