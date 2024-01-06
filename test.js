const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'app.log');

// Function to write logs to a file
const writeLogToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
};

// Simulate a time-consuming operation
const simulateTimeoutIssue = () => {
  writeLogToFile('Start of time-consuming operation');

  // Simulate a long-running operation (e.g., querying a database)
  setTimeout(() => {
    writeLogToFile('End of time-consuming operation');
  }, 5000); // Simulated delay of 5 seconds
};

// Example: Trigger the simulated timeout issue
simulateTimeoutIssue();
