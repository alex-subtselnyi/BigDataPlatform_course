FROM node:10
WORKDIR /
COPY package*.json ./
#RUN npm set registry http://192.168.1.160:4873/
RUN npm install
# If building code for production
# RUN npm ci --only=production
# Bundle app source
COPY . .
EXPOSE 8000
CMD node [ "node", "index.js" ] 

