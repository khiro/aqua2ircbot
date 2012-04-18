var fs = require('fs');
var sys = require("util");
var http = require('http');
var child_process = require('child_process');

var irc = require('./irc');
var htmlparser = require('htmlparser');
var shortener = require('urlshortener');

var s = new shortener.Shortener();
var channel = 'CHANNEL';
var server = 'SERVER';
var name = 'aqua_eq';
var aqua = 'http://www.hinet.bosai.go.jp';
var last_eq_time = '';

var bot = new irc.Client(server, name, {
  debug: true,
  password: 'guestdegues',
  channels: [channel]
});

bot.addListener('error', function(message) {
  console.log('ERROR: ' + message.command + ': ' + message.args.join(' '));
});

var handlerAQUA = new htmlparser.DefaultHandler(function(err, dom) {
  if(err) {
    sys.debug('Error: ' + err);
  }
  else {
    var trs = htmlparser.DomUtils.getElementsByTagName('tr', dom);
    var imgs = htmlparser.DomUtils.getElementsByTagName('img', dom);

    if (trs === undefined || imgs === undefined)
    {
      console.log('latest_eq undefined');
      return;
    }
    
    //console.log(sys.inspect(trs[6]));
    //console.log(trs[6].children[2].children[0]['raw']);
    var eq_time = trs[6].children[2].children[0]['raw'];
    var north_latitude = trs[7].children[2].children[0]['raw'];
    var east_longtitude = trs[8].children[2].children[0]['raw'];
    var depth = trs[9].children[2].children[0]['raw'];
    var magnitude = trs[10].children[2].children[0]['raw'];
    var img_url = imgs[1].attribs['src'];

    if (last_eq_time === eq_time) {
      console.log('same eq');
      return;
    }

    parseAQUATop(function(place, top_img_url) {
      s.bitly(aqua + img_url, 'USER', 'KEY', 'json',
              function(result) {
                var msg = "[AQUA] " + place + " 北緯:" + north_latitude + " 東経:" + east_longtitude + " 深さ:" + depth + " M:" + magnitude + " " + result['data']['url'] + " " + top_img_url;
                console.log(msg);
                bot.say(channel, msg);
              });
    });
    
    last_eq_time = eq_time;
  }
});


function parseAQUAHTML() {
  var wget_command = child_process.exec('./get_aqua_02.sh', 
  function (error, stdout, stderr) {
    console.log(stdout.toString());
    console.log(stderr.toString());
    if (error !== null) {
     console.log('exec error: ' + error);
    }
    fs.readFile('aqua_eq-utf8.html', function(err, data) {
      if (err) throw err;
      //console.log(data.toString());
      var parser = new htmlparser.Parser(handlerAQUA);
      parser.parseComplete(data.toString());
    });
  });
}

var handlerAQUATop = new htmlparser.DefaultHandler(function(err, dom) {
  if(err) {
    sys.debug('Error: ' + err);
  }
  else {
    //var trs = htmlparser.DomUtils.getElementsByTagName('TR', dom);
    //console.log(trs[22].children[0].children[0].raw);
  }
});

function parseAQUATop(callback) {
  var wget_command = child_process.exec('./get_aqua_03.sh', 
  function (error, stdout, stderr) {
    console.log(stdout.toString());
    console.log(stderr.toString());
    if (error !== null) {
     console.log('exec error: ' + error);
    }
    fs.readFile('aqua_top-utf8.html', function(err, data) {
      if (err) throw err;
      //console.log(data.toString());
      var parser = new htmlparser.Parser(handlerAQUATop);
      parser.parseComplete(data.toString());
      parser.done();
      var trs = htmlparser.DomUtils.getElementsByTagName('TR', handlerAQUATop.dom);
      var place = trs[22].children[0].children[0].raw;
      //console.log(place);

      var imgs = htmlparser.DomUtils.getElementsByTagName('IMG', handlerAQUATop.dom);
      var img_url = imgs[11].attribs['SRC'];
      //console.log(img_url)

      s.bitly(aqua + img_url, 'khiro', 'R_da6e2fb4922ae82151861008a8c3666a', 'json',
              function(result) {
                callback(place, result['data']['url']);
              });
    });
  });
}

var timer = setInterval(parseAQUAHTML, 60000);
//parseAQUATop(function(place, img_url) {
//  console.log(place);
//  console.log(img_url);
//});
