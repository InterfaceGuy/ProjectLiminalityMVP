const fs = require('fs');
const path = require('path');

class Logger {
    constructor(filename) {
        this.logFile = path.join(__dirname, filename);
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp}: ${message}\n`;
        fs.appendFileSync(this.logFile, logMessage);
        console.log(message); // Also log to console for immediate feedback
    }

    clear() {
        fs.writeFileSync(this.logFile, ''); // Clear the log file
    }
}

module.exports = new Logger('app.log');
