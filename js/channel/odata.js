define([
    'component/http/channel/core', 
    'component/http/channel/odata-core', 
    'component/http/channel/odata-batch'
],
function (core, ajax, batch) {
  'use strict';

  function defaults (options) {
    return function() {
      var arg = core.signature(arguments);

      var op = _.defaults({}, arg[1], options);

      return ajax.apply(this, [arg[0], op, arg[2]]);
    }
  }

  var post = defaults({ method : 'POST' });

  // upload using FormData with content-type multipart/form-data. 
  // FormData is not avaiable until IE 10.
  function upload (/*url, options, cb*/) {
    var arg = core.signature(arguments);

    var op = _.defaults({}, arg[1], {
      data : new FormData(),
      xhr  : function() {
        var xhr = core.xhr();
        
        if (arg[1].progress && xhr.upload) {
          xhr.upload.addEventListener('progress', arg[1].progress, false);
        }

        return xhr;
      },
      contentType: false,
      processData: false
    });
  
    op.data.append('file', arg[1].file);

    return post.apply(this, [arg[0], op, arg[2]]);
  }

  return {
      get             : defaults({ method : 'GET' })
    , post            : defaults({ method : 'POST' })
    , put             : defaults({ method : 'PUT' })
    , patch           : defaults({ method : 'PATCH' })
    , delete          : defaults({ method : 'DELETE' })
    , upload          : upload
    , ajax            : ajax
    , batch           : batch
    , defaults        : defaults
  };
});