import semver from 'semver';

class SDKMigration {
  static matches(name) {
    return this.name === name ||
      this.aliases?.includes(name);
  }

  static get aliased() {
    return `${this.name}${(
      !this.aliases?.length ? ''
        : ` (${this.aliases.join(', ')})`
    )}`;
  }

  constructor(name, version) {
    if (name) this.installed = { name, version };
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

  get needsUpgrade() {
    return !(
      this.installed &&
      this.installed.name === this.name &&
      semver.subset(this.installed.version, this.version)
    );
  }
}

module.exports = SDKMigration;
