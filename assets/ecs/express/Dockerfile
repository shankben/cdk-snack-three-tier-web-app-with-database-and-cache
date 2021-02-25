FROM public.ecr.aws/bitnami/node:14
EXPOSE 8000
WORKDIR /express/app
COPY app/package.json ./
RUN npm install
COPY app/ ./
ENTRYPOINT ["node", "index.js"]
