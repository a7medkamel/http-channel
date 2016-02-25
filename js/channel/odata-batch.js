define([
  'lib/underscore', 
  'component/uuid/index', 
  'component/config/index', 
  'component/http/channel/odata-core',
  'component/http/util/multipart'
],
function (_, uuid, config, ajax, multipart) {
  'use strict';

  function batch(options, cb) {
    var boundary  = uuid.v4()
      , url       = config.get('odata.batch_url')
      ;

    return ajax(url, {
        method      : 'POST',
        data        : multipart.generate(options, boundary),
        contentType : 'multipart/mixed; boundary="' + boundary + '"',
        dataType    : 'text'
      }, function(err, response, textStatus, xhr) {
        var res = [];
        if(!err)  {
          res = multipart.parse(response);          
        }

        cb && cb(err, res, textStatus, xhr);
      });
  }

  return batch;
});
