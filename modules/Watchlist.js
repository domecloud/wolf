const chalk = require('chalk')
const numeral     = require('numeral')
const moment      = require('moment')

/*
<--- Wolf.js --->
    const Watchlist = require('./Watchlist.js');
    init() {
        const watchlist = new Watchlist({
            config: this.config,
            ticker: this.ticker,
            state: this.state
        });
        watchlist.init();
    }
*/

module.exports = class Watchlist {
    constructor(config) {
        this.config = config.config;
        this.state = config.state;
        this.ticker = config.ticker;
        this.wolf = config.wolf;
        this.logger = config.logger;
        this.meta = {
            watchlist: {}
        }
    }

    init() {
        this.meta = Object.assign(this.getters(), this.meta);
    }

    add(orderId, txn) {
        this.meta.watchlist[orderId] = txn;
    }

    remove(orderId) {
        delete this.meta.watchlist[orderId];
    }

    //watch for any triggers i.e STOP_LIMIT_PERCENTAGE, PROFIT_LOCK_PERCENTAGE, and repopulate queue accordingly via this.wolf.sell()
    watch() {
        const watchlist = this.meta.watchlist;
        const queue = this.meta.queue;
        const config = this.config;
        const state = this.state;
        for (let orderId in watchlist) {
            const order = watchlist[orderId];
            const orderPrice = Number(order.price);
            const orderQuantity = Number(order.executedQty);
            const currentPrice = this.ticker.meta.bid;
            const logger = this.logger;
	    var pnl = 100.00*(parseFloat(currentPrice)-orderPrice)/orderPrice;
	    const newStats = chalk.grey(moment().format('h:mm:ss').padStart(8))
		    + chalk.yellow(order.symbol.padStart(10))
		    + chalk.green((chalk.grey("qty:")+numeral(orderQuantity).format("0.000")).padStart(24))
		    + chalk.grey(" @ ") + chalk.cyan(currentPrice).padEnd(24)
		    + ((pnl >= 0)?chalk.green((chalk.grey("pnl:")+numeral(pnl).format("0.000")).padStart(16)):chalk.red((chalk.grey("pnl:")+numeral(pnl).format("0.000")).padStart(16)))

            logger.status(newStats);


            let shouldSell = false;
            if (currentPrice >= (orderPrice + (orderPrice * config.profitPercentage))) shouldSell = true;                         //profit percentage trigger
            if (state.paranoid && (currentPrice <= orderPrice + (orderPrice * config.profitLockPercentage))) {              //profit lock trigger
                console.log(' [ALARM]::: Price dipped below PROFIT_LOCK_PERCENTAGE while in paranoid mode. Selling.');
                state.profitLockPercentageMet = true;  //used for mocha testing
                shouldSell = true;
            }
            if (config.profitLockPercentage && (currentPrice >= orderPrice + (orderPrice * config.profitLockPercentage))) { //profit lock trigger
                console.log(' [ALARM]::: PROFIT_LOCK_PERCENTAGE REACHED. Now in paranoid mode.')
                state.paranoid = true;
            }
            if (config.stopLimitPercentage && (currentPrice <= orderPrice - (orderPrice * config.stopLimitPercentage))) {   //stop limit trigger
                console.log(' [ALARM]::: STOP_LIMIT_PERCENTAGE REACHED. Exiting position.');
                state.stopLimitPercentageMet = true;
                shouldSell = true;
            }
            if (shouldSell) {
              	this.wolf.sell(orderQuantity, currentPrice);
                state.paranoid = false;
                this.remove(orderId);
            }
        }
    }

    getters() {
        return {
            get length() { return Object.keys(this.watchlist).length }
        }
    }
}
