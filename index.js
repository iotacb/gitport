#!/usr/bin/env node
import https from "https";
import { Octokit } from "@octokit/core";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { fileURLToPath } from "url";
import { createSpinner } from "nanospinner";
import chalk from "chalk";
import getUsage from "command-line-usage";
import commandLineArgs from "command-line-args";
import figlet from "figlet";

let octokit;
let gitPath = "";
let importDircetory = "";

// Generated with figlet
const title = `
┏┓• ┏┓     
┃┓┓╋┃┃┏┓┏┓╋
┗┛┗┗┣┛┗┛┛ ┗
`;

const usageSections = [
	{
		content: chalk.cyan(title),
		raw: true,
	},
	{
		header: "GitPort",
		content: ["> gitport {bold --help}", "> gitport {bold --reset}"],
	},
];

const availableArgs = [
	{
		name: "help",
		alias: "h",
		type: Boolean,
	},
	{
		name: "reset",
		alias: "r",
		type: Boolean,
	},
];
const options = commandLineArgs(availableArgs);

async function askOptions() {
	const answers = await inquirer.prompt([
		{
			name: "directory",
			type: "input",
			message: "Select import directory (default: currentDirectory)",
		},
		{
			name: "url",
			type: "input",
			message: "Select git url",
		},
	]);
	gitPath = answers.url;
	importDircetory = answers.directory || ".";
}

async function downloadFile(fileUrl, filePath) {
	const downloadSpinner = createSpinner("Importing file: " + filePath);
	downloadSpinner.start();
	return new Promise((resolve, reject) => {
		https
			.get(fileUrl, (res) => {
				const fileStream = fs.createWriteStream(filePath);
				res.pipe(fileStream);

				fileStream.on("finish", () => {
					fileStream.close();
					resolve();
					downloadSpinner.success({
						text: `Imported file: ${filePath}`,
					});
				});

				fileStream.on("error", (err) => {
					downloadSpinner.error({
						text: `Error downloading file: ${filePath}`,
					});
					console.log(err);
					reject(err);
				});
			})
			.on("error", (err) => {
				downloadSpinner.error({
					text: `HTTP request error for file: ${filePath}`,
				});
				console.log(err);
				reject(err);
			});
	});
}

async function downloadDirectory(owner, repo, dirPath, localPath) {
	if (!fs.existsSync(localPath)) {
		fs.mkdirSync(localPath, { recursive: true });
	}
	const contents = await octokit.request(
		"GET /repos/{owner}/{repo}/contents/{path}",
		{
			owner: owner,
			repo: repo,
			path: dirPath,
		}
	);

	if (!contents.data) {
		console.log("Something went wrong!");
		return;
	}

	for (const item of contents.data) {
		const itemPath = path.join(localPath, item.name);
		if (item.type === "file") {
			await downloadFile(item.download_url, itemPath);
		} else if (item.type === "dir") {
			await downloadDirectory(owner, repo, item.path, itemPath);
		}
	}
}

async function importFiles() {
	const importFolder = importDircetory;
	if (!fs.existsSync(importFolder)) {
		fs.mkdirSync(importFolder);
	}
	const ownerName = gitPath.split("/")[3];
	const repoName = gitPath.split("/")[4];
	await downloadDirectory(ownerName, repoName, "", importFolder);
}

async function checkForToken() {
	const envFilePath = path.resolve(
		fileURLToPath(path.dirname(import.meta.url)),
		".env"
	);
	let token = "";
	if (!fs.existsSync(envFilePath)) {
		console.log(chalk.yellow("No token found!"));
		const askedToken = await askForToken();
		if (askedToken) {
			token = askedToken;
			fs.writeFileSync(envFilePath, `GITHUB_TOKEN=${token}`);
		} else {
			throw new Error(
				"Please enter a valid token! (Token entered? Try resetting with --reset)"
			);
		}
	} else {
		const data = fs.readFileSync(envFilePath, "utf8");
		if (!data || !data.includes("GITHUB_TOKEN=")) {
			console.log(chalk.yellow("No token found!"));
			const askedToken = await askForToken();
			if (askedToken) {
				token = askedToken;
				fs.writeFileSync(envFilePath, `GITHUB_TOKEN=${token}`);
			} else {
				throw new Error(
					"Please enter a valid token! (Token entered? Try resetting with --reset)"
				);
			}
		} else {
			token = data.split("=")[1].trim();
		}
	}
	if (!token || token === "") {
		throw new Error("Please enter a valid token! (Try resetting with --reset)");
	}
	octokit = new Octokit({
		auth: token,
	});
}

async function resetToken() {
	const envFilePath = path.resolve(
		fileURLToPath(path.dirname(import.meta.url)),
		".env"
	);
	if (fs.existsSync(envFilePath)) {
		fs.unlinkSync(envFilePath);
		console.log(chalk.yellow("Token reset successfully!"));
	} else {
		console.log(chalk.yellow("Token reset successfully!"));
	}
}

async function askForToken() {
	const answers = await inquirer.prompt([
		{
			name: "token",
			type: "input",
			message:
				"Please enter your github token (Create token here: https://github.com/settings/tokens/new)",
		},
	]);
	return answers.token;
}

console.clear();
if (options.help) {
	console.log(getUsage(usageSections));
} else if (options.reset) {
	resetToken();
} else {
	await checkForToken();
	await askOptions();
	await importFiles();
	console.log(chalk.green("Imported files successfully!"));
}
