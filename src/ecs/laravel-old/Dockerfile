FROM php:7.4-fpm-alpine

ENV COMPOSER_ALLOW_SUPERUSER 1

ARG DEPS="\
  bash \
  coreutils \
  git \
  libmcrypt \
  libzip \
  openssh-client \
  tini \
  unzip \
  zip"

ARG BUILD_DEPS="\
  autoconf \
  build-base \
  gcc \
  libmcrypt-dev \
  libzip-dev \
  make \
  mercurial \
  patch \
  subversion \
  zlib-dev"

COPY ./php/php-cli.ini /usr/local/etc/php/

RUN \
  set -e && \
  apk add --no-cache $DEPS && \
  apk add --no-cache --virtual build-deps $BUILD_DEPS && \
  docker-php-ext-install zip pdo pdo_mysql && \
  EXPECTED_CHECKSUM="$(wget -q -O - https://composer.github.io/installer.sig)" && \
  php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" && \
  ACTUAL_CHECKSUM=$(php -r "echo hash_file(\"sha384\", \"composer-setup.php\");") && \
  if [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]; then \
    rm composer-setup.php \
    exit 1; \
  fi && \
  php composer-setup.php --install-dir=/usr/local/bin --filename=composer && \
  rm composer-setup.php && \
  composer global require laravel/installer && \
  addgroup -g 1000 laravel && \
  adduser -G laravel -g laravel -s /bin/sh -D laravel && \
  mkdir -p /var/www/html && \
  chown laravel:laravel /var/www/html && \
  apk del build-deps

ENV PATH="$PATH:/root/.composer/vendor/bin"
COPY ./php/www.conf /usr/local/etc/php-fpm.d/www.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
WORKDIR /var/www/html
RUN laravel new app
WORKDIR /var/www/html/app
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host", "0.0.0.0"]
