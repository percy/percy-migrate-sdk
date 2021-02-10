# @percy/migrate

![Test](https://github.com/percy/percy-migrate-sdk/workflows/Test/badge.svg)

`@percy/migrate` is used to upgrade and migrate your Percy SDK to the latest version.

## What does it do?

This automates the following steps necessary to migrate your SDK to the latest version. In fact,
each step can be performed manually without this tool to acheive the same outcome.

1. Attempts to detect your SDK by examining your project's dependencies.
2. Installs `@percy/cli` to your project (and uninstalls `@percy/agent` if present).
3. Updates your SDK to the latest version.
4. Maybe prompts to run code mods on specific files.
5. Migrates any Percy config file to the latest version.

## Usage

``` sh-session
$ npx @percy/migrate --help
Upgrade and migrate your Percy SDK to the latest version

USAGE
  $ npx @percy/migrate [SDK_NAME]

ARGUMENTS
  SDK_NAME  name of the Percy SDK to migrate (detected by default)

OPTIONS
  -h, --help     show CLI help
  -q, --quiet    log errors only
  -v, --verbose  log everything
  -v, --version  show CLI version
  --silent       log nothing

EXAMPLES
  $ npx @percy/migrate
  $ npx @percy/migrate @percy/puppeteer
```
