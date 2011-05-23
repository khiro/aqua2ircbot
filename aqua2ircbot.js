var https = require('https');
var u = require('url');
var sys = require("sys");
var htmlparser = require('htmlparser');
var fs = require('fs');
var child_process = require('child_process');

var irc = require('./irc');
var channel = '#CHANNEL';
var server = 'SERVER';
var name = 'aqua_eq';
var aqua = 'http://www.hinet.bosai.go.jp/hypo/AQUA/';
var source_event_id = '';

var bot = new irc.Client(server, name, {
  debug: true,
  password: 'PASSWORD',
  channels: [channel]
});

bot.addListener('error', function(message) {
  console.log('ERROR: ' + message.command + ': ' + message.args.join(' '));
});

var handler = new htmlparser.DefaultHandler(function(err, dom) {
  if(err) {
    sys.debug('Error: ' + err);
  }
  else {
    //sys.debug(sys.inspect(dom, false, null));
    var trs = htmlparser.DomUtils.getElementsByTagName('tr', dom);
    //sys.debug("id: " + sys.inspect(trs, false, null));
    sys.debug(trs.length);
    var latest_eq = trs[trs.length-1];
    //sys.debug(sys.inspect(last_eq, false, null));
    //for (var i = 0; i < latest_eq.children.length; i++) {
      //sys.debug(sys.inspect(latest_eq.children[i], false, null));
    //}
    if (latest_eq == undefined)
    {
      console.log('latest_eq undefined');
      return;
    }
    var source = latest_eq.children[0];
    var center_place = latest_eq.children[1];
    var north_latitude = latest_eq.children[2];
    var east_longtitude = latest_eq.children[3];
    var depth = latest_eq.children[4];
    var magnitude = latest_eq.children[5];
    var decided_date = latest_eq.children[6];

    if (source.children[0].attribs.href == undefined)
    {
      console.log('source.children[0].href undefined');
      return;
    }
    var url = aqua + source.children[0].attribs.href;
    var new_source_event_id = source.children[0].attribs.href.substr(11,23);
    if (source_event_id == new_source_event_id) {
      console.log("same eq");
    } else {
      var msg = "[AQUA-HYPO] " + source.children[0].children[0].data + " " + center_place.children[0].data + " 北緯:" + north_latitude.children[0].data + " 東経:" + east_longtitude.children[0].data + " 深さ:" + depth.children[0].data + " M" + magnitude.children[0].data; //  + " " + decided_date.children[0].data;
      shorter(url, function(data) {
        eval("obj="+data);
        bot.say(channel, msg + ' ' + obj['id']);
      });
      //bot.say(channel, msg);
      source_event_id = new_source_event_id;
    }
  }
});

function shorter(longurl, callback) {
  var options = {
    host: 'www.googleapis.com',
    port: 443,
    path: '/urlshortener/v1/url',
    headers: {'Content-Type': 'application/json'},
    method: 'POST'
  };
  var key = 'AIzaSyDXjrXrqpwBUmnhsL8s7DnD5GSHWQKYXbk';

  var req = https.request(options, function(res) {
    var data = '';
    res.on('data', function(d) {
      data += d;
      callback(data);
    });
    res.on('error', function(e) {
      console.error(e);
    });
  })

  var payload = '{"longUrl":"' + longurl + '", "key":"' + key + '"}';
  req.write(payload);
  req.end();
}

function parseHTML() {
  var wget_command = child_process.exec('./get_aqua.sh', 
  function (error, stdout, stderr) {
    console.log(stdout.toString());
    console.log(stderr.toString());
    if (error !== null) {
     console.log('exec error: ' + error);
    }
    fs.readFile('index-utf8.cgi', function(err, data) {
      if (err) throw err;
      //console.log(data.toString());
      var parser = new htmlparser.Parser(handler);
      parser.parseComplete(data.toString());
    });
  });
}

var timer = setInterval(parseHTML, 60000);

