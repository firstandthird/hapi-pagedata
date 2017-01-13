/* eslint strict: 0, max-len: 0, prefer-arrow-callback: 0 */
'use strict';
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const expect = require('code').expect;
const Hapi = require('hapi');
const async = require('async');
let server;

lab.experiment('route testing', () => {
  lab.beforeEach(done => {
    server = new Hapi.Server({
      debug: { log: ['error', 'info', 'hapi-pagedata'], request: ['error'] }
    });
    server.connection({ port: 8080 });
    done();
  });
  lab.afterEach((done) => {
    server.stop(done);
  });
  // tests
  lab.test('main route', allDone => {
    async.auto({
      register: (done) => {
        server.method('test', (cb) => {
          setTimeout(() => {
            cb(null, { pre: true });
          }, 500);
        });
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
      routes: ['register', (done) => {
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
        server.route({
          path: '/',
          method: 'GET',
          config: {
            pre: [
              { method: 'test()', assign: 'test' }
            ],
            plugins: {
              'hapi-pagedata': {
                pages: ['test', 'test-2']
              }
            }
          },
          handler(request, reply) {
            reply(request.pre);
          }
        });
        server.start(done);
      }],
      inject: ['routes', (done) => {
        server.inject({
          url: '/'
        }, (response) => {
          done(null, response);
        });
      }],
      verify: ['inject', (done, results) => {
        const response = results.inject;
        expect(response.statusCode).to.equal(200);
        expect(typeof response.result).to.equal('object');
        expect(typeof response.result.pageData.test).to.equal('object');
        expect(response.result.pageData.test.site).to.equal('site');
        expect(response.result.pageData.test.page).to.equal('test');
        done();
      }]
    }, (err) => {
      expect(err).to.equal(null);
      return allDone();
    });
  });
});

lab.experiment('server methods and extensions', () => {
  lab.beforeEach(done => {
    server = new Hapi.Server({
      debug: { log: ['error', 'info', 'hapi-pagedata'], request: ['error'] }
    });
    server.connection({ port: 8080 });
    done();
  });
  lab.afterEach((done) => {
    server.stop(done);
  });

  lab.test('registers', allDone => {
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
      verify: ['register', (done) => {
        expect(typeof server.methods.pageData).to.equal('object');
        expect(typeof server.methods.pageData.set).to.equal('function');
        expect(typeof server.methods.pageData.get).to.equal('function');
        done();
      }]
    }, (err) => {
      expect(err).to.equal(null);
      return allDone();
    });
  });

  lab.test('set', allDone => {
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
      routes: ['register', (done) => {
        //mock pagedata
        server.route({
          path: '/api/sites/{site}/pages/{page}',
          method: 'GET',
          handler(request, reply) {
            expect()
            reply({
              content: {
                site: request.params.site,
                page: request.params.page,
                tag: request.query.tag
              }
            });
          }
        });
        server.start(done);
      }],
      set: ['routes', (done, results) => {
        server.methods.pageData.set('site', 'key1', done);
      }],
      get: ['set', (done, results) => {
        server.methods.pageData.get('site', 'key1', 0, done);
      }]
    }, (err, results) => {
      expect(err).to.equal(null);
      expect(results.get.length).to.equal(3);
      expect(results.get[0].site).to.equal('site');
      expect(results.get[0].page).to.equal('key1');
      expect(results.get[0].tag).to.equal('test');
      return allDone();
    });
  });
});

lab.experiment('exposed server objects', () => {
  lab.beforeEach(done => {
    server = new Hapi.Server({
      debug: { log: ['error', 'info', 'hapi-pagedata'], request: ['error'] }
    });
    server.connection({ port: 8080 });
    done();
  });
  lab.afterEach((done) => {
    server.stop(done);
  });
  lab.test('set', allDone => {
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
      api: ['register', (done, results) => {
        expect(server.plugins['hapi-pagedata'].api).to.exist;
        expect(server.plugins['hapi-pagedata'].api.PageData).to.exist;
        expect(typeof server.plugins['hapi-pagedata'].api.options).to.equal('object');
        expect(server.plugins['hapi-pagedata'].api.options.key).to.equal('key');
        done();
      }],
      cache: ['api', (done, results) => {
        expect(server.plugins['hapi-pagedata'].cache).to.exist;
        expect(typeof server.plugins['hapi-pagedata'].cache.rule).to.equal('object');
        expect(server.plugins['hapi-pagedata'].cache.rule.expiresIn).to.equal(1);
        done();
      }]
    }, allDone);
  });
});

lab.experiment('exposed server objects', () => {
  lab.beforeEach(done => {
    server = new Hapi.Server({
      debug: { log: ['error', 'info', 'hapi-pagedata'], request: ['error'] }
    });
    server.connection({ port: 8080 });
    done();
  });
  lab.afterEach((done) => {
    server.stop(done);
  });
  lab.test('set', allDone => {
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
      route: ['register', (done, results) => {
        server.method('test', (cb) => {
          setTimeout(() => {
            cb(null, { some: 'thing' });
          }, 500);
        });
        server.route({
          path: '/',
          method: 'GET',
          config: {
            pre: [
              { method: 'test()', assign: 'test' }
            ],
          },
          handler(request, reply) {
            expect(typeof request.pre.test).to.equal('object');
            expect(request.pre.test.some).to.equal('thing');
            reply(request.pre);
          }
        });
        server.start(done);
      }],
      verify: ['route', (done, results) => {
        server.inject({
          url: '/',
          method: 'GET',
        }, () => {
          done();
        });
      }]
    }, allDone);
  });
});
