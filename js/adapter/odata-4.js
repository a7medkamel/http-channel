define([
      'lib/underscore'
  ], function(_){

  function from(params, from_version) {
    // TEMP REMOVE $format because MT objects
    delete params.$format;

    // support [odata v4]
    if (params.$inlinecount) {
        delete params.$inlinecount;
        params.$count = true;
    }

    // delete filter if its empty
    if (!(_.isString(params.$filter) && params.$filter.length )) {
        delete params.$filter;
    }

    // support [odata v4]
    if (params.$filter) {
        // replace substringof by contains
        params.$filter = params.$filter.replace(/substringof\(('.*?'),(tolower\([\w\/]+?\))\)/g, 'contains($2, $1)');
      
        // replace substringof by contains
        params.$filter = params.$filter.replace(/substringof\(('.*?'),([\w\/]+?)\)/g, 'contains($2, $1)');

        // replace enum eq formating
        params.$filter = params.$filter.replace(/'Enum\.(\w+)''(\w+)'''/g, 'Enum.$1\'$2\'');

        // replace datetime'somedate' by somedate
        params.$filter = params.$filter.replace(/datetime'(.*?)'/g, '$1+00:00');

        // replace L long strings to just numbers
        params.$filter = params.$filter.replace(/'(\d+?)L'/g, '$1');
    }

    return params;
  }

  return {
      from : from
  };
});