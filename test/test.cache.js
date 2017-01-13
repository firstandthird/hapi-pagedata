/* eslint strict: 0, max-len: 0, prefer-arrow-callback: 0 */
'use strict';
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const expect = require('code').expect;
const Hapi = require('hapi');
const async = require('async');
let server;

lab.experiment('cache', () => {
  lab.beforeEach(done => {
    server = new Hapi.Server({
      debug: { log: ['error', 'info', 'hapi-pagedata', 'pagedata'], request: ['error'] }
    });
    server.connection({ port: 8080 });
    //mock pagedata
    server.route({
      path: '/api/sites/{site}/pages/{page}',
      method: 'GET',
      handler(request, reply) {
        reply({
          content: {
            site: request.params.site,
            page: request.params.page
          }
        });
      }
    });
    done();
  });
  lab.afterEach((done) => {
    server.stop(done);
  });

  lab.test('hook pongs when pinged', allDone => {
    async.auto({
      register: (done) => {
        server.register({
          register: require('../'),
          options: {
            host: 'http://localhost:8080',
            key: 'key',
            cacheEndpoint: '/cache',
            hookEndpoint: '/hook',
            verbose: true,
            site: 'site',
            tag: 'test'
          }
        }, done);
      },
      verify: ['register', (done, results) => {
        server.inject({
          method: 'POST',
          url: '/hook',
          payload: {
            event: 'ping'
          }
        }, (res) => {
          expect(res.result).to.equal('pong');
          done();
        });
      }]
    }, allDone);
  });

  lab.test('hook skips if tags not matched', allDone => {
    async.auto({
      register: (done) => {
        server.register({
          register: require('../'),
          options: {
            host: 'http://localhost:8080',
            key: 'key',
            cacheEndpoint: '/cache',
            hookEndpoint: '/hook',
            verbose: true,
            site: 'site',
            tag: 'test'
          }
        }, done);
      },
      verify: ['register', (done, results) => {
        server.inject({
          method: 'POST',
          url: '/hook',
          payload: {
            tags: ['no']
          }
        }, (res) => {
          expect(res.result).to.equal('skipped');
          done();
        });
      }]
    }, allDone);
  });

  lab.test('hook fires if tag matches', allDone => {
    async.auto({
      register: (done) => {
        server.register({
          register: require('../'),
          options: {
            host: 'http://localhost:8080',
            key: 'key',
            cacheEndpoint: '/cache',
            hookEndpoint: '/hook',
            verbose: true,
            site: 'site',
            tag: 'test'
          }
        }, done);
      },
      verify: ['register', (done, results) => {
        server.start(() => {
          server.inject({
            method: 'POST',
            url: '/hook',
            payload: {
              tags: ['test'],
              slug: 'site1',
              content: 'not really'
            }
          }, (res) => {
            expect(res.result).to.equal('ok');
            const stats = server.plugins['hapi-pagedata'].cache.stats;
            expect(stats.sets).to.equal(1);
            expect(stats.errors).to.equal(0);
            done();
          });
        });
      }]
    }, allDone);
  });

  lab.test('reports cache stats', allDone => {
    async.auto({
      register: (done) => {
        server.register({
          register: require('../'),
          options: {
            host: 'http://localhost:8080',
            key: 'key',
            cacheEndpoint: '/cache',
            hookEndpoint: '/hook',
            verbose: true,
            site: 'site',
            tag: 'test'
          }
        }, done);
      },
      set: ['register', (done) => {
        server.start(() => {
          server.methods.pageData.set('site1', 'data', done);
        });
      }],
      verify: ['set', (done, results) => {
        server.inject({
          method: 'GET',
          url: '/cache',
        }, (res) => {
          expect(res.result.sets).to.equal(1);
          done();
        });
      }]
    }, allDone);
  });

  lab.test('supports DELETE an item', allDone => {
    async.auto({
      register: (done) => {
        server.register({
          register: require('../'),
          options: {
            host: 'http://localhost:8080',
            key: 'key',
            cacheEndpoint: '/cache',
            hookEndpoint: '/hook',
            verbose: true,
            site: 'site',
            tag: 'test',
            cache: {
              enabled: true
            }
          }
        }, server.start(done));
      },
      verify: ['register', (done, results) => {
        server.methods.pageData.set('site', 'data1', (err) => {
          expect(err).to.equal(null);
        });
        server.methods.pageData.set('site', 'data2', (err) => {
          expect(err).to.equal(null);
        });
        const cache = server.plugins['hapi-pagedata'].cache;
        setTimeout(() => {
          // cache not empty:
          expect(cache._cache.connection.byteSize).to.not.equal(0);
          server.inject({
            method: 'DELETE',
            url: '/cache?id=site'
          }, (res2) => {
            expect(res2.result).to.equal('ok');
            expect(cache._cache.connection.byteSize).to.equal(0);
            done();
          });
        }, 100);
      }]
    }, allDone);
  });

  lab.test('cache disabled', allDone => {
    async.auto({
      register: (done) => {
        server.register({
          register: require('../'),
          options: {
            host: 'http://localhost:8080',
            key: 'key',
            cacheEndpoint: '/cache',
            hookEndpoint: '/hook',
            verbose: true,
            site: 'site',
            tag: 'test',
            cache: {
              enabled: false
            }
          }
        }, server.start(done));
      },
      verify: ['register', (done, results) => {
        const cache = server.plugins['hapi-pagedata'].cache;
        expect(cache.rule.expiresIn).to.equal(1);
        expect(cache._cache.connection.byteSize).to.equal(0);
        server.methods.pageData.set('site', 'data1', (err) => {
          expect(err).to.equal(null);
        });
        // cache should be emptied by now:
        setTimeout(() => {
          expect(cache._cache.connection.byteSize).to.equal(0);
          done();
        }, 500);
      }]
    }, allDone);
  });

  lab.test('cache enabled', allDone => {
    async.auto({
      register: (done) => {
        server.register({
          register: require('../'),
          options: {
            host: 'http://localhost:8080',
            key: 'key',
            cacheEndpoint: '/cache',
            hookEndpoint: '/hook',
            verbose: true,
            site: 'site',
            tag: 'test',
            cache: {
              enabled: true
            }
          }
        }, server.start(done));
      },
      verify: ['register', (done, results) => {
        const cache = server.plugins['hapi-pagedata'].cache;
        expect(cache.rule.expiresIn).to.not.equal(1);
        expect(cache._cache.connection.byteSize).to.equal(0);
        server.methods.pageData.set('site', 'data1', (err) => {
          expect(err).to.equal(null);
        });
        // cache should be emptied by now:
        setTimeout(() => {
          expect(cache._cache.connection.byteSize).to.not.equal(0);
          done();
        }, 500);
      }]
    }, allDone);
  });
});
