'use strict';
const Hoek = require('hoek');
const async = require('async');
module.exports = function(server, api, config) {
  if (!config.hookEndpoint) {
    return;
  }

  server.route({
    method: 'POST',
    path: config.hookEndpoint,
    handler(request, reply) {
      const payload = request.payload;

      if (payload.event && payload.event === 'ping') {
        return reply('pong');
      }

      if (config.status === 'published' && payload.status !== 'published') {
        //tags don't match
        server.log(['pagedata', 'pagedata-hook', 'info'], { message: 'cache hook skipped', slug: payload.slug, configStatus: config.status, pageStatus: payload.status });
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
        dropProjectPages(get, done) {
          if (!config.enableProjectPagesCache || !get.project) {
            return done();
          }
          server.methods.pagedata.getProjectPages.cache.drop(get.project.slug, done);
        },
        projectPages(get, dropProjectPages, done) {
          if (!config.enableProjectPagesCache || !get.project) {
            return done();
          }
          server.methods.pagedata.getProjectPages(get.project.slug, (err, pages) => {
            done(err, pages);
          });
        },
        dropParentPages(get, done) {
          if (!config.enableParentPagesCache || !get.parentPage) {
            return done();
          }
          server.methods.pagedata.getCollectionPages.cache.drop(get.parentPage.slug, done);
        },
        parentPages(dropParentPages, get, done) {
          if (!config.enableParentPagesCache || !get.parentPage) {
            return done();
          }
          server.methods.pagedata.getCollectionPages(get.parentPage.slug, done);
        },
        hook(get, done) {
          if (config.hookSuccessMethod) {
            const method = Hoek.reach(server.methods, config.hookSuccessMethod);
            if (!method) {
              server.log(['pagedata', 'pagedata-hook', 'error'], `${config.hookSuccessMethod} doesn't exist`);
            } else {
              method(payload.slug, payload.status);
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
          status: config.status,
          project: page.project ? page.project.slug : undefined,
        });
        if (results.projectPages) {
          server.log(['pagedata', 'pagedata-hook'], {
            message: 'Project pages cache updated',
            projectSlug: results.get.project.slug
          });
        }
        if (results.parentPages) {
          server.log(['pagedata', 'pagedata-hook'], {
            message: 'Parent pages cache updated',
            projectSlug: results.get.parentPage.slug
          });
        }
      });

      reply('ok');
    }
  });
};
