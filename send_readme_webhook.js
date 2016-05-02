#!/usr/bin/env node
var http = require('https');
var url = require('url');
var request = require("request")

var stdin = process.openStdin();

var data = "";

stdin.on('data', function(chunk) {

  data += chunk;
  console.log(data)
});

stdin.on('end', function() {
  var readme = "Changelog for Public API build " + process.env['SDK_VERSION'];
  readme += "\n";

  var changes = JSON.parse(data);

  if(changes["Major"]){
      readme += "# Breaking Changes\n"

      for(var x=0; x< changes["Major"].length; x++){
          readme += "* " + changes["Major"][x] + "\n";
      }
  }

  if(changes["Minor"]){
      readme += "# Minor Changes\n"

      for(var x=0; x< changes["Minor"].length; x++){
          readme += "* " + changes["Minor"][x] + "\n";
      }
  }

  if(changes["Point"]){
      readme += "# Point Increment Changes\n"

      for(var x=0; x< changes["Point"].length; x++){
          readme += "* " + changes["Point"][x] + "\n";
      }
  }


  var webhook = {
      message: readme,
      metadata: "changelog"
  }
  //console.log(webhook);
  if(process.env['WEBHOOK_URL'] != null && process.env['WEBHOOK_URL'] != ''){
      var webhookUrl = url.parse(process.env['WEBHOOK_URL'])
      request({
        url: webhookUrl,
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: webhook
     }, function (err, res) {
        //console.log(res);
        //console.log(err);
     });

  }

});
