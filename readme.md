To run the server for the driver-panic-button app, you need to set up the environment variables, install dependencies, and initialize the database. Here is the step-by-step guide:
1. Prerequisites
Ensure you have Node.js and pnpm installed. You also need a MySQL database instance.
2. Environment Configuration
Create a .env file in the root directory of the project and add the following variables:
env

# Database Connection
DATABASE_URL=mysql://user:password@localhost:3306/driver_panic_db

# Authentication (Manus OAuth)
VITE_APP_ID=your_app_id
JWT_SECRET=your_jwt_secret
OAUTH_SERVER_URL=https://auth.manus.im
OWNER_OPEN_ID=your_open_id

# Server Port (Optional, defaults to 3000 )
PORT=3000

3. Install Dependencies
Run the following command to install all necessary packages:
Bash

pnpm install

4. Database Setup
The project uses Drizzle ORM. You need to push the schema to your MySQL database:
Bash

pnpm db:push

This command will generate the necessary tables (like users) in your database.
5. Start the Server
You can start the server in development mode (with auto-reload) or production mode:
Development Mode:
Bash

pnpm dev:server

Production Mode:
Bash

pnpm build
pnpm start

6. Verify the Server
Once the server is running, you can check its health by visiting:
http://localhost:3000/api/health
Summary of Scripts
Command
	
Description
pnpm dev
	
Starts both the server and the Metro bundler (for the mobile app ).
pnpm dev:server
	
Starts only the backend server.
pnpm db:push
	
Syncs your database schema with the code.
pnpm build
	
Bundles the server for production.
If you are running the mobile app alongside the server, simply use pnpm dev to start both simultaneously.