import EmberMigration from './ember.js';
import CypressMigration from './cypress.js';
import TestCafeMigration from './testcafe.js';
import PuppeteerMigration from './puppeteer.js';
import NightmareMigration from './nightmare.js';
import NightwatchMigration from './nightwatch.js';
import ProtractorMigration from './protractor.js';
import WebdriverMigration from './webdriverio.js';
import SeleniumJSMigration from './selenium-javascript.js';
// non-js
import CapybaraMigration from './capybara.js';
import SeleniumJavaMigration from './selenium-java.js';
import SeleniumPythonMigration from './selenium-python.js';

export const migrations = [
  CypressMigration,
  TestCafeMigration,
  PuppeteerMigration,
  NightmareMigration,
  NightwatchMigration,
  ProtractorMigration,
  WebdriverMigration,
  EmberMigration,
  CapybaraMigration,
  SeleniumJSMigration,
  SeleniumJavaMigration,
  SeleniumPythonMigration
];
