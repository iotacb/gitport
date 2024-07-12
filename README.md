# GitPort

A small CLI to import files, without cloning, from a GitHub repository


## Installation
```sh
npm i gitport -g
```
Will install the CLI globally on you machine.

## Motivation

The main reason why I created this CLI is because I wanted to be able to import all my personal utility files into project without copy pasting them.
Cloning the repo with the GitHub CLI does not work when the folder is not empty and I did not find any solution for my problem, so I made one myself.

## Usage

```sh
gitport [--help, --reset]
-
npx gitport [--help, --reset]
```

1. You will be asked for a GitHub Token (Create [here](https://github.com/settings/tokens/new))
2. Enter a destination for the files (Default is the current working directory `.`)
3. Enter the repository where the files should be imported from

## Options

| Name       | Alias | Usage                                         | Description                         |
| :--------- | :---- | :-------------------------------------------- | :------------|
| `help` | `h`   | gitport **--help** | Prints a help screen    |
| `reset` | `r`  | gitport **--reset**                | Resets the GitHub token, use when there are any problems        |