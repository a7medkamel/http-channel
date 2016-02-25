define([
    'lib/underscore', 
    'component/config/index', 
    'component/http/util/url',
    'component/safe-json/index'
  ],
function (_, config, url_util, safeJSON) {
  'use strict';

  function generate(options, boundary) {
    var lines = [];

    _.each(options.reqs, function (req) {
      var method  = req.type.toUpperCase()
        , url     = url_util.make(req.url)
        , host    = url_util.host(options)
        ;      

      lines.push('--' + boundary);
      
      //[imang]: the content-type and content-transfer-encoding headers must be present for delete reqs inside a batch call
      if (method != 'GET' /*&& method != 'DELETE'*/) {
        lines.push('Content-Type: ' + (req.contentType || 'application/http'));
        lines.push('Content-Transfer-Encoding: ' + (req.contentTransferEncoding || 'binary'));
      }

      lines.push('', method + ' ' + url + ' HTTP/1.1');

      lines.push('Host: ' + host);
      
      if(!_.isNull(req.data) && !_.isUndefined(req.data)) {
        lines.push('Content-Type: ' +  (req.dataContentType || 'application/json; charset=utf-8'));
        lines.push('', JSON.stringify(req.data));
      }

      lines.push('\r\n');
    });

    if(lines.length) {      
      lines.push('--' + boundary + '--', '');
    }

    return lines.join('\r\n');
  }

  function parse (text) {
    var text         = text || ''
      , lines        = text.split('\r\n')
      , boundary     = lines[0]
      , responses    = []
      , tmp          = null
      ;

    _.each(lines, function (line) {
      if (line.length) {
        if (line.indexOf(boundary) == 0) {
          if (tmp) {
            responses.push(tmp);
          }

          tmp = {};
        } else if (tmp) {
          if (!tmp.status) {
            tmp.status = parseInt((function (num) {
              return num || [0, 0];
            })(/HTTP\/1.1 ([0-9]+)/g.exec(line))[1], 10);
          } else if (!tmp.data && line == '{') {
            tmp.data = line;            
          } else if (tmp.data) {
            tmp.data += line;

            if(line == '}') {
              tmp.data = safeJSON.parseSync(tmp.data);
            }
          }
        }
      }
    });

    return responses;
  }

  return {
    generate : generate,
    parse    : parse
  }
});