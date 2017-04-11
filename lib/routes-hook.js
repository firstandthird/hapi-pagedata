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
            server.methods.pagedata.getPage(payload.slug, (err, page) => {
              done(err, page);
            });
          },
          pagesQuery(get, done) {
            if (!config.enablePagesCache) {
              return done();
            }
            const query = { siteSlug: get.site.slug };
            if (get.collectionId) {
              query.collection = get.collectionId;
            }
            if (config.cachePagesWithContent) {
              query.includeContent = true;
            }
            done(null, query);
          },
          dropPages(pagesQuery, done) {
            if (!pagesQuery) {
              return done();
            }
            const id = JSON.stringify(pagesQuery);
            server.methods.pagedata.getPages.cache.drop(id, done);
          },
          getPages(pagesQuery, dropPages, done) {
            if (!pagesQuery) {
              return done();
            }
            server.methods.pagedata.getPages(pagesQuery, done);
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
          const page = results.get;
          server.log(['pagedata', 'pagedata-hook'], {
            message: 'Cache updated',
            slug: page.slug,
            tags: payload.tags,
            serverTag: config.tag,
            site: page.site.slug,
            collectionId: page.collectionId
          });
          if (results.pagesQuery) {
            server.log(['pagedata', 'pagedata-hook'], {
              message: 'Pages cache updated',
              query: results.pagesQuery
            });
          }
        });

        reply('ok');
      }
    }
  ];
};
