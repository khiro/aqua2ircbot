#!/bin/sh
wget http://www.hinet.bosai.go.jp/hypo/AQUA/index.cgi -O index.cgi
iconv -f EUC-JP -t UTF-8 index.cgi > index-utf8.cgi
