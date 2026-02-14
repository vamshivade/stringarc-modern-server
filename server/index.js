import Config from "config";
import Routes from "./routes";
import Server from "./common/server";
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });
const dbUrl = process.env.databaseURI;
const swaggerDefinition = process.env.swaggerDefinition;
const port = process.env.port || 8888; // Default to port 8888 if not defined

if (!dbUrl || !swaggerDefinition) {
  console.error("Missing required environment variables!");
  process.exit(1); 
}

let server;
try {
  server = new Server()
    .router(Routes)
    .configureSwagger(JSON.parse(swaggerDefinition))  
    .handleError()
    .configureDb(dbUrl)
    .then((_server) => _server.listen(port));  
} catch (err) {
  console.error("Error starting the server:", err);
  process.exit(1);  
}
export default server;

