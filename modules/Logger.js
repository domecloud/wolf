const chalk = require('chalk')
const ora = require('ora');
const numeral     = require('numeral')

/*

<--- Wolf.js --->

const Logger = require('./Logger.js');

init() {
    const logger = new Logger(this.meta);
    this.logger = logger.init();
    logger({queueCount: 1, watchCount: 0});
    logger.success('bought ADA @ 12.2313');
    logger({queueCount: 0, watchCount: 1});
}

*/

module.exports = class Logger {
    constructor(config) {
        this.logger = null;
        this.stats = null;
        this.queueCount = 0;
        this.watchCount = 0;
    }

    init() {
        this.logger = ora({text: 'Initializing...', color: 'green'}).start();
    }

    status(stats) {
        try {
                
//            const newStats =  (!trade.maker?chalk.green((chalk.grey("qty:")+numeral(trade.quantity).format("0.000")).padStart(24)):chalk.red((chalk.grey("qty:")+numeral(trade.quantity).format("0.000")).padStart(24)))
//    + chalk.grey(" @ ") + chalk.cyan(trade.price).padEnd(24)
//        	+ ((pnl >= 0)?chalk.green((chalk.grey("pnl:")+numeral(pnl).format("0.000")).padStart(16)):chalk.red((chalk.grey("pnl:")+numeral(pnl).format("0.000")).padStart(16))) 
//            );
	    const newStats = stats;
            this.stats = newStats;
            this.logger.text = newStats;
        } catch(err) {
            console.log('LOGGER ERROR: ', err);
            return false;
        }
    }

    success(message) {
        try {
            const logger = this.logger;
            logger.succeed(message);
            logger.start(this.stats);
        } catch(err) {
            console.log('LOGGER ERROR: ', err);
            return false;
        }
    }
};
