define([
  'lib/underscore',
  'component/config/index', 
  'component/state/index',
  'component/url/index'
],
function (_, config, state, $url) {
  'use strict';

  function host(options) {
    return config.has(options.host)? config.get(options.host) : options.host;
  }

  function path(options) {
    return config.has(options.path)? config.get(options.path) : options.path;
  }

  function fill(url, options) {
    var options   = options || {}
      , ret       = url
      , params    = {}
      ;

    if (options.use_state !== false) {
      params = state.attributes;
    }

    if (options.params) {
      params = _.extend({}, params, options.params);
    }

    ret = url.replace(/:([a-zA-Z_]+)/g, function(match, key){
      // try to replace with value from params; otherwise keep as original
      return _.has(params, key) ? params[key] : match;
    });

    return ret;
  }

  function expand(url, options) {
    var options   = options || {}
      , ret       = url
      ;

    if (options.host && !/^http/.test(ret)) {
      ret = $url.join(host(options), path(options), ret);
    }

    // replace all param placeholders by backbone style slugs
    // ex: /Customers()/Accounts()/ becomes /Customers(:customer_id)/Accounts(:account_id)/
    ret = ret.replace(/((\w+?)s?)(\(\))/g, function(match, col, type){
      return col + '(:' + type.toLowerCase() + '_id)';
    });

    return ret;
  }

  function make(url, options) {
    return fill(expand(url, options));
  }

  function queryify(url, options) {
    var isGet = !options.method || options.method === 'GET';
    if (isGet && _.isObject(options.data)) {
      return $url.queryify(url, options.data);
    }

    return url;
  }

  function getDomain() {
      return document.domain;
  }

   function getProtocol() {
      return window.location.protocol;
  }

   function getPort() {
      return window.location.port;
  }

  return {
      fill        : fill
    , expand      : expand
    , make        : make
    , host        : host
    , path        : path
    , queryify    : queryify
    , getDomain   : getDomain
    , getProtocol : getProtocol
    , getPort     : getPort
  };
});