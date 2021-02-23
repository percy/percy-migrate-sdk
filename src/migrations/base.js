import semver from 'semver';

class SDKMigration {
  // default SDK language
  static language = 'js';

  // returns true for the same language and matching name/alias
  static matches(name, lang) {
    return (!lang || this.language === lang) &&
      (this.name === name || this.aliases?.includes(name));
  }

  // returns a formated string matching "{name} ({aliases})"
  static get aliased() {
    return `${this.name}${(
      !this.aliases?.length ? ''
        : ` (${this.aliases.join(', ')})`
    )}`;
  }

  // initialized with the installed SDK info
  constructor(installed) {
    this.installed = installed;
    this.transforms = [];
  }

  get name() {
    return this.constructor.name;
  }

  // get aliases() {
  //   return this.constructor.aliases;
  // }

  get aliased() {
    return this.constructor.aliased;
  }

  get version() {
    return this.constructor.version;
  }

  // returns true if the SDK is not installed or if the installed SDK has
  // a different name or version subset
  get needsUpgrade() {
    return !(
      this.installed &&
      this.installed.name === this.name &&
      semver.subset(this.installed.version, this.version)
    );
  }
}

module.exports = SDKMigration;
