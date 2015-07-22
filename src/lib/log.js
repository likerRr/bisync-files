"use strict";

var chalk = require('chalk');

function print(fnColor) {
	var msgBag = Array.prototype.slice.call(arguments, 1);

	printColored(msgBag, fnColor);
}

function printBind(fnColor) {
	return print.bind(print, fnColor);
}

function printColored(text, fnColor) {
	text.map(function(str) {
		console.log(fnColor(str));
	});
}

module.exports = {
	added: printBind(chalk.green),
	changed: printBind(chalk.blue),
	unlinked: printBind(chalk.dim),
	error: printBind(chalk.white.bgRed.bold),
	log: printBind(chalk.underline),
	welcome: printBind(chalk.cyan)
};
