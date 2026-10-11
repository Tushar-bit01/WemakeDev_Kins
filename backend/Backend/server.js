// This file starts the HTTP server and shuts it down safely

require('dotenv').config();

const app = require('./src/app');
const { registerShutdownHandlers } = require('./src/utils/shutdown');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Register graceful shutdown for SIGTERM, SIGINT, uncaughtException, unhandledRejection
registerShutdownHandlers(server);