const { withAppBuildGradle, withAndroidManifest } = require('expo/config-plugins');

module.exports = function withPlayRelease(config) {
  config = withAndroidManifest(config, mod => {
    // Timer plans and anonymous access identity are not silently restored via OS backup.
    const app = mod.modResults.manifest.application[0].$;
    app['android:allowBackup'] = 'false';
    app['android:fullBackupContent'] = 'false';
    return mod;
  });
  return withAppBuildGradle(config, mod => {
    if (!process.env.CORPTIMER_UPLOAD_STORE_FILE) return mod;
    const signing = `
        corptimerUpload {
            storeFile file(System.getenv('CORPTIMER_UPLOAD_STORE_FILE'))
            storePassword System.getenv('CORPTIMER_UPLOAD_STORE_PASSWORD')
            keyAlias System.getenv('CORPTIMER_UPLOAD_KEY_ALIAS')
            keyPassword System.getenv('CORPTIMER_UPLOAD_KEY_PASSWORD')
        }
`;
    if (!mod.modResults.contents.includes('signingConfigs {')) throw Error('Android signing template changed');
    mod.modResults.contents = mod.modResults.contents.replace('signingConfigs {', 'signingConfigs {' + signing)
      .replace(/signingConfig signingConfigs.debug/g, 'signingConfig signingConfigs.corptimerUpload');
    return mod;
  });
};
