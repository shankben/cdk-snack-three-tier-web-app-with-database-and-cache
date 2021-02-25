FROM public.ecr.aws/bitnami/python:3.7
RUN \
  apt update && \
  apt install -y \
    default-libmysqlclient-dev && \
  python -m pip install \
    Django \
    mysql
EXPOSE 8000
WORKDIR /django/app
COPY app/ ./
ENTRYPOINT ["python", "manage.py", "runserver", "8000"]
