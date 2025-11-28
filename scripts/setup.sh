#!/bin/bash
source ../.bashrc
install-php.js
install-composer.js
composer config --global cache-dir $PWD/.cache
composer config --global repositories.local-proxy path "$PWD/composer-proxy"
npm run composer global install
