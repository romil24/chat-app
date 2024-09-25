# Chat Application

<img src="https://camo.githubusercontent.com/d668acbf047004e41f1b003580965e2ed1bb450ad66c3a56bdd60c8352792f12/68747470733a2f2f692e70696e696d672e636f6d2f6f726967696e616c732f65332f31622f37352f65333162373532383735363739623634666365303039393232663966306464612e676966" alt="Real-Time Chat Application" style="width: 300px; height: 200px;">

Welcome to our Real-Time Chat Application! This is a chat application built using React for the front end and Node.js for the back end. The application allows users to authenticate, send messages, and participate in chat rooms.

## Table of Contents

- [Features](#features)
- [Setup](#setup)
  - [Client Setup](#client-setup)
  - [Backend Setup](#backend-setup)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## Features

- Real-time messaging
- User authentication
- Search user chat functionality (to be implemented)

## Setup

To set up the client and backend for this application, follow the instructions below:

### Client Setup

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/romil24/chat-app.git
   ```

2. Navigate to the client directory:
   ```bash
   cd client
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a **.env** file in the root of the **client directory** with the following keys:
   ```bash
   BACK_END_URL=http://localhost:8080
   ```
5. Start the development server:

```bach
npm run dev
```

6. Access the application at **http://localhost:3000** in your browser.

### Backend Setup

1. Navigate to the client directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a **.env** file in the root of the **server directory** with the following keys:

#### Environment Variables

```env
# Server Configuration
PORT=8080
MONGO_MEMORY_SERVER_PORT=10000
MONGODB_URI=mongodb://mongodb:27017
NODE_ENV=development
EXPRESS_SESSION_SECRET=7fdOMCFRSLD9cv1k-5n3Dz5n3DmVmVHVIg9GG_OGTUkBfLNdgZAwKDNtoCJ0X0cyqaM0ogR80-zh9kx0Mkx

# JWT Configuration
ACCESS_TOKEN_SECRET=LD9cv1kBfgRHVIg9GG_OGzh9TUkcyqgZAaM0o3DmVkx08MCFRSzMocyO3UtNdDNtoCJ0X0-5nLwK7fdO
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=CMdDNtowK7fX0-5D9cv0oJ008MCFRSLHVTUkcyqgZAaIg9GG_OGzh9zMocyO3UtN1kBfLRn3DmVkxdO
REFRESH_TOKEN_EXPIRY=10d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# API Configuration
FREEAPI_HOST_URL=http://localhost:8080
```

4. Start the development server:

```bach
npm run dev
```

### Concurrently

The concurrently package is used to run both the client and server applications simultaneously. By using the dev script, you can easily start both the front end and back end in one command:

```bash
npm run dev
```

This command executes the client and server scripts in parallel, allowing you to develop and test your application more efficiently.

Package.json Scripts Overview
server: Starts the backend server.
client: Starts the frontend development server.
dev: Runs both the client and server using concurrently.

### Contributing

Contributions are welcome! Please open an issue or submit a pull request to suggest improvements or new features.
