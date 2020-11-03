FROM php:7-alpine

ENV COMPOSER_ALLOW_SUPERUSER 1
ENV COMPOSER_HOME /tmp
ENV COMPOSER_VERSION 2.0.4

ARG COMPOSER_URL="https://raw.githubusercontent.com/composer/getcomposer.org/cb19f2aa3aeaa2006c0cd69a7ef011eb31463067/web/installer"
ARG INSTALLER_HASH="48e3236262b34d30969dca3c37281b3b4bbe3221bda826ac6a9a62d6444cdb0dcd0615698a5cbe587c3f0fe57a54d8f5"

ARG DEPS="\
  bash \
  coreutils \
  git \
  make \
  mercurial \
  openssh-client \
  patch \
  subversion \
  tini \
  unzip \
  zip \
  libzip-dev \
  zlib-dev"

COPY ./php/php-cli.ini /usr/local/etc/php/

RUN \
  set -eux && \
  apk add --no-cache $DEPS && \
  docker-php-ext-install zip pdo pdo_mysql && \
  curl --silent --fail --location --retry 3 \
    --output /tmp/installer.php \
    --url $COMPOSER_URL && \
  php -r " \
    \$signature = '${INSTALLER_HASH}'; \
    \$hash = hash('sha384', file_get_contents('/tmp/installer.php')); \
    if (!hash_equals(\$signature, \$hash)) { \
      unlink('/tmp/installer.php'); \
      echo 'Integrity check failed, installer is either corrupt or worse.' . PHP_EOL; \
      exit(1); \
    }"; \
  php /tmp/installer.php \
    --no-ansi \
    --install-dir=/usr/bin \
    --filename=composer \
    --version=${COMPOSER_VERSION} && \
  composer --ansi --version --no-interaction && \
  rm -f /tmp/installer.php && \
  find /tmp -type d -exec chmod -v 1777 {} +

COPY ./php/www.conf /usr/local/etc/php-fpm.d/www.conf

RUN \
  addgroup -g 1000 laravel && \
  adduser -G laravel -g laravel -s /bin/sh -D laravel && \
  mkdir -p /var/www/html && \
  chown laravel:laravel /var/www/html

COPY docker-entrypoint.sh /docker-entrypoint.sh

WORKDIR /var/www/html

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["composer"]
