FROM public.ecr.aws/bitnami/python:3.7

EXPOSE 8000

ARG DEPS="\
  default-libmysqlclient-dev"

ARG PYTHON_DEPS="\
  Django \
  mysql"

RUN \
  apt update && \
  apt install -y $DEPS && \
  python -m pip install $PYTHON_DEPS

WORKDIR /django/app
COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY app/ ./
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0:8000"]
