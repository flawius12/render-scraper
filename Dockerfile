FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Render will set PORT automatically
EXPOSE 3000

CMD ["npm", "start"]
