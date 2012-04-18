#!/bin/sh
curl http://www.hinet.bosai.go.jp/ -o aqua_top.html
iconv -f EUC-JP -t UTF-8 aqua_top.html > aqua_top-utf8.html
