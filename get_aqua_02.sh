#!/bin/sh
curl http://www.hinet.bosai.go.jp/AQUA/aqua_eq.php -o aqua_eq.html
iconv -f EUC-JP -t UTF-8 aqua_eq.html > aqua_eq-utf8.html
