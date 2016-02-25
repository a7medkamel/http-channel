define([
    'lib/underscore'
  , 'lib/jquery'
  , 'lib/bluebird'
  , 'component/safe-json/index'
  , 'component/http/util/url'
  , 'component/state/index'
  ],
function (_, $, Promise, safeJSON, url_util, state) {
  'use strict';

  var default_options = {
    contentType : 'application/json',
    dataType    : 'json',
    cache       : false,
    type        : 'GET'
  };

  function getResponseHeaders(xhr) {
    var ret = {};

    var str = xhr.getAllResponseHeaders();
    var arr = str && str.split('\r\n');
    var reg = /^([^:]*): (.*)$/; 

    _.each(arr, function(header) {
      // sample header: 'key: value'
      var matches = header.match(reg);
      matches && (ret[matches[1]] = matches[2]);
    });

    return ret;
  }

  function stringify(data, options) {
    if (!options.method || options.method === 'GET') {
      return undefined;
    }

    if (!_.isString(data) && options.contentType === 'application/json') {
      return JSON.stringify(data);
    }

    return data;
  }

  function signature(/*url, options, cb*/) {
    var arg = _.toArray(arguments);

    if (_.isArray(arg[0])) {
      arg = arg[0];
    } else if (_.isArguments(arg[0])) {
      arg = _.toArray(arg[0]);
    }

    if (_.isObject(arg[0])) {
      // options is first arg
      return [
          arg[0].uri || arg[0].url
        , arg[0]
        , arg[1]
      ];
    } else if (_.isFunction(arg[1])) {
      // url is string, but options is omited
      return [
          arg[0]
        , {}
        , arg[1]
      ];
    }

    return [
        arg[0]
      , arg[1]
      , arg[2]
    ];
  }

  function ajax(/*url, options, cb*/) {
    var arg = signature(arguments);

    var url     = arg[0]
      , options = arg[1]
      , cb      = arg[2];

    // todo handle upper case method
    var $op = _.defaults({
      type              : options.method? options.method.toUpperCase() : undefined,
      xhrFields         : { withCredentials : options.withCredentials },
      success           : function(response, textStatus, xhr) {
        options.success && options.success(response, textStatus, xhr);

        cb && cb(null, response, textStatus, xhr);
      },
      error             : function (xhr, textStatus, errorThrown) {
        if (xhr && xhr.status === 401) {
          state.trigger('http.auth.error');
        }

        options.error && options.error(xhr, textStatus, errorThrown);

        var details = {
            xhr               : xhr
          , textStatus        : textStatus
          , error             : errorThrown
          , headers           : getResponseHeaders(xhr)
        };

        safeJSON.parse(xhr.responseText, function(err, res){
          if (err) {
            cb && cb(_.extend(new Error('could not parse error'), details));
            return;
          }

          details.body = res;

          if ($op.parse) {
            details.errors = $op.parse(res);
          }

          if ($op.i18nErrors && details.errors) {
            details.i18nErrors = $op.i18nErrors;
          }

          cb && cb(details);
        });
      }
    }, _.pick(options, 'contentType', 'dataType', 'cache', 'beforeSend', 'complete', 'bypassAjaxLogging', 'processData', 'xhr', 'parse', 'i18nErrors'), default_options);

    $op.url  = url_util.queryify(url, options);
    $op.data = stringify(options.data, options);

    return Promise
            .resolve($.ajax($op))
            .catch(function(err) {
              var extraInfo = { 
                  body: safeJSON.parseSync(err.responseText)
                , headers: getResponseHeaders(err) 
              };

              if ($op.parse) {
                extraInfo.errors = $op.parse(extraInfo.body);
              }

              if ($op.i18nErrors && extraInfo.errors) {
                extraInfo.i18nErrors = $op.i18nErrors;
              }

              throw _.extend(err, extraInfo);
            })
            .cancellable()
            ;
  }

  function defaults (options) {
    return function() {
      var arg = signature(arguments);

      var op = _.defaults({}, arg[1], options);

      return ajax.apply(this, [arg[0], op, arg[2]]);
    };
  }

  function xhr() {
    return $.ajaxSettings.xhr();
  }

  return {
      get             : defaults({ method : 'GET' })
    , post            : defaults({ method : 'POST' })
    , put             : defaults({ method : 'PUT' })
    , patch           : defaults({ method : 'PATCH' })
    , delete          : defaults({ method : 'DELETE' })
    , ajax            : ajax
    , signature       : signature
    , defaults        : defaults
    , xhr             : xhr
  };
});
