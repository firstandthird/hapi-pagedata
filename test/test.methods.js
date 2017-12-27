/* eslint strict: 0, max-len: 0, prefer-arrow-callback: 0 */
'use strict';
const Hapi = require('hapi');
const pkg = require('../package.json');
const tap = require('tap');
let server;
let mockServer;

tap.beforeEach(async() => {
  server = new Hapi.Server({
    debug: { log: ['error', 'info', 'hapi-pagedata'], request: ['error'] },
    port: 8081
  });
  mockServer = new Hapi.Server({
    debug: { log: ['error', 'info', 'hapi-pagedata'], request: ['error'] },
    port: 8080
  });
  await mockServer.start();
});

tap.afterEach(async() => {
  await mockServer.stop();
});

tap.test('exposes api and instantiates it with correct options', async(t) => {
  await server.register({
    plugin: require('../'),
    options: {
      host: 'http://localhost:8080',
      key: 'key',
      status: 'published',
      timeout: 800,
      appName: 'theApp'
    }
  });
  await server.start();
  t.equal(typeof server.pagedata, 'object', 'adds the pagedata API to the server');
  t.deepEqual(server.pagedata.options, {
    host: 'http://localhost:8080',
    key: 'key',
    status: 'published',
    timeout: 800,
    userAgent: `theApp hapi-pagedata/${pkg.version}`
  }, 'configures the pagedata API correctly');
  t.equal(typeof server.pagedata.getPage, 'function', 'API provides the getPage method');
  t.equal(typeof server.pagedata.getPages, 'function', 'API provides the getPages method');
  t.equal(typeof server.pagedata.getProjects, 'function', 'API provides the getProjects method');
  await server.stop();
  t.end();
});

tap.test('throws error if incorrectly configured', async(t) => {
  try {
    await server.register({
      plugin: require('../'),
      options: {
        host: 'http://localhost:8080',
        key: 'key',
        somethingsSomethingCache: 'true',
        timeout: 800,
        appName: 'theApp'
      }
    });
  } catch (e) {
    t.equal(e.details[0].message, '"somethingsSomethingCache" is not allowed');
    await server.stop();
    t.end();
  }
});
