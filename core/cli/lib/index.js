"use strict";
module.exports = core;
let args;
const path = require("path");
const userHome = require("user-home");
const pathExists = require("path-exists").sync;
const semver = require("semver");
const colors = require("colors/safe");
const log = require("@scaffold-lf/log");
const pkg = require("../package.json");
const constant = require("./const");

function core() {
	try {
		checkPkgVersion();
		checkNodeVersion();
		checkRoot();
		checkUserHome();
		checkInputArgs();
		checkEnv();
		checkGlobalUpdate();
	} catch (error) {
		log.error(error.message);
	}
}

function checkPkgVersion() {
	log.info("cli", pkg.version);
}

function checkNodeVersion() {
	const currentVersion = process.version;
	const lowestVersion = constant.LOWEST_NODE_VERSION;
	if (!semver.gte(currentVersion, lowestVersion)) {
		throw new Error(
			colors.red(`脚手架 需要安装 v${lowestVersion} 以上版本的Node.js`)
		);
	}
}

function checkRoot() {
	const rootCheck = require("root-check");
	rootCheck();
}

function checkUserHome() {
	if (!userHome || !pathExists(userHome)) {
		throw new Error(colors.red("当前登录用户主目录不存在！"));
	}
}

function checkInputArgs() {
	const minimist = require("minimist");
	args = minimist(process.argv.slice(2));
	checkArgs();
}

function checkArgs() {
	if (args.debug) {
		process.env.LOG_LEVEL = "verbose";
	} else {
		process.env.LOG_LEVEL = "info";
	}
	log.level = process.env.LOG_LEVEL;
}

function checkEnv() {
	const dotenv = require("dotenv");
	const dotenvPath = path.resolve(userHome, ".env");
	if (pathExists(dotenvPath)) {
		dotenv.config({
			path: dotenvPath,
		});
	}
	createDefaultConfig();
	log.verbose("环境变量", process.env.CLI_HOME_PATH);
}

function createDefaultConfig() {
	const cliConfig = {
		home: userHome,
	};
	if (process.env.CLI_HOME) {
		cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
		// log.verbose("debug", path.join(userHome, process.env.CLI_HOME));
	} else {
		cliConfig["cliHome"] = path.join(userHome, constant.DEFAULT_CLI_HOME);
	}
	process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

async function checkGlobalUpdate() {
	const currentVersion = pkg.version;
	const npmName = pkg.name;
	const { getNpmSemverVersion } = require("@scaffold-lf/get-npm-info");
	const lastVersion = await getNpmSemverVersion(currentVersion, npmName);
	if (lastVersion && semver.gt(lastVersion, currentVersion)) {
		log.warn(
			colors.yellow(`请手动更新 ${npmName}，当前版本：${currentVersion}，最新版本：${lastVersion}
					更新命令： npm install -g ${npmName}`)
		);
	}
}
