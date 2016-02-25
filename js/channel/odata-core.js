define([
    'lib/underscore', 
    'component/config/index', 
    'component/uuid/index', 
    'component/http/channel/core', 
    'component/http/util/url'
  ],
function (_, config, uuid, core, url_util) {
  'use strict';

  function ajax(/*url, options, cb*/) {
    var arg = core.signature(arguments);

    var url     = arg[0]
      , options = arg[1]
      , cb      = arg[2]
      ;

    if (!options.host) {
      options.host = 'odata.url';
    }

    if (!options.path) {
      options.path = 'odata.path';
    }

    var uri = url_util.make(url, { 
        host        : options.host
      , path        : options.path
      , use_state   : options.use_state
      , params      : options.params
    });

    options.beforeSend = _.wrap(options.beforeSend, function (func, jqXHR) {
      jqXHR.setRequestHeader('Authorization', 'CCMTSmallToken ' + config.get('odata.token'));

      var loginType = config.get('odata.loginType');
      loginType && jqXHR.setRequestHeader('x-ms-logintype', loginType);

      // enable odata annotations by default; we use annotations to return aggregates in grid responses
      jqXHR.setRequestHeader('Prefer', 'odata.include-annotations="*"');

      jqXHR.setRequestHeader('x-ms-requestid', uuid.v4());
      jqXHR.setRequestHeader('x-ms-applicationname', 'bingadsweb[' + config.get('application.name') + ']');

      // call the original func we are wrapping here
      _.isFunction(func) && func(jqXHR);
    });

    options.parse = function(err) {
      return err.value;
    };

    options.i18nErrors = function(errs, i18n){
      if (errs){
        return _.map(errs, function(err) { return i18n.getStringOrDefault.apply(i18n, ['Error_Campaign_API_' + err.Code, i18n.getString('Error: ') + err.Code ]); });
      }
      return [];
    };

    if (_.isUndefined(options.contentType)) {
      options.contentType = 'application/json';
    }
    
    return core.ajax(uri, options, cb);
  }
  
  return ajax;
});