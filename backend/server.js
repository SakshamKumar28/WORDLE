import app from "./src/app.js";
import connectDB from "./src/lib/db.js";
import { port } from "./src/config/config.js";

/**
 * Starting of Server
 * @function startServer
 */
async function startServer(params) {
  connectDB().then(
    app.listen(port, () => {
      console.log(`Server is running on port : ${port}`);
    }),
  );
}

startServer();
