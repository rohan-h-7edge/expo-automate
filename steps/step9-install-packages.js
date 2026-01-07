const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Terminal colors for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

/**
 * Step 9: Install required packages with latest versions
 */
function registerStep9(plop) {
  plop.setActionType('install-packages', function (answers, config, plop) {
    const projectDir = path.resolve(config.projectDir);
    
    if (!fs.existsSync(projectDir)) {
      return colors.yellow + '  ⚠️  ' + colors.reset + 'Project directory not found: ' + projectDir;
    }
    
    const packageJsonPath = path.join(projectDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return colors.yellow + '  ⚠️  ' + colors.reset + 'package.json not found';
    }
    
    try {
      // Read current package.json
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Get build variants from answers
      const buildVariants = answers.buildVariants || [];
      
          // Build scripts object with base scripts
          const scripts = {
            "start": "expo start --clear",
            "prebuild": "DOTENV_CONFIG_DEBUG=false expo prebuild --npm",
            "prebuild:clean": "DOTENV_CONFIG_DEBUG=false expo prebuild --clean --npm",
            "web": "expo start --web",
            "lint": "expo lint"
          };
      
      // Add Android scripts for each selected variant
      // Note: Run 'npm run prebuild' first to regenerate native projects with correct package name
      buildVariants.forEach(variant => {
        scripts[`android:${variant}`] = `APP_VARIANT=${variant} expo run:android`;
        scripts[`android:${variant}:device`] = `APP_VARIANT=${variant} expo run:android --device`;
      });
      
      // Add iOS scripts for each selected variant
      // Note: Run 'npm run prebuild' first to regenerate native projects with correct bundle identifier
      buildVariants.forEach(variant => {
        // Map variant names to iOS configuration names
        const iosConfigMap = {
          'develop': 'Debug',
          'qa': 'Debug',
          'preprod': 'Release',
          'prod': 'Release'
        };
        const configName = iosConfigMap[variant] || 'Debug';
        scripts[`ios:${variant}`] = `APP_VARIANT=${variant} expo run:ios --configuration ${configName}`;
        scripts[`ios:${variant}:device`] = `APP_VARIANT=${variant} expo run:ios --device --configuration ${configName}`;
      });
      
      // Add default android and ios scripts (use first variant)
      // Note: Run 'npm run prebuild' first to regenerate native projects with correct package name
      if (buildVariants.length > 0) {
        const firstVariant = buildVariants[0];
        scripts["android"] = `APP_VARIANT=${firstVariant} expo run:android`;
        scripts["android:device"] = `APP_VARIANT=${firstVariant} expo run:android --device`;
        // Default iOS scripts use Debug configuration (default)
        scripts["ios"] = `APP_VARIANT=${firstVariant} expo run:ios`;
        scripts["ios:device"] = `APP_VARIANT=${firstVariant} expo run:ios --device`;
      }
      
      packageJson.scripts = scripts;
      
      // Update dependencies (using latest versions)
      packageJson.dependencies = {
        "@react-navigation/drawer": "^7.0.0",
        "@react-navigation/native": "^7.0.0",
        "dotenv": "^16.4.5",
        "expo": "^54.0.0",
        "expo-font": "~14.0.10",
        "expo-linking": "^8.0.11",
        "expo-notifications": "~0.32.15",
        "expo-status-bar": "~3.0.9",
        "react": "^19.1.0",
        "react-native": "^0.81.5",
        "react-native-gesture-handler": "~2.28.0",
        "react-native-reanimated": "~4.1.1",
        "react-native-safe-area-context": "~5.6.0",
        "react-native-screens": "~4.16.0"
      };
      
      // Update devDependencies (using latest versions)
      packageJson.devDependencies = {
        "@types/react": "~19.1.10",
        "eslint-config-expo": "~10.0.0",
        "eslint-config-prettier": "^10.1.8",
        "eslint-plugin-prettier": "^5.5.4",
        "eslint-plugin-react-compiler": "^19.1.0-rc.2",
        "prettier": "^3.7.4",
        "typescript": "^5.9.2"
      };
      
      // Write updated package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      
      // Build install command with latest versions
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const packages = Object.keys(allDeps).map(pkg => `${pkg}@latest`).join(' ');
      
      // Install packages with latest versions (suppress output for cleaner UI)
      execSync(
        `npm install ${packages}`,
        {
          stdio: 'pipe',
          cwd: projectDir,
          encoding: 'utf8',
          shell: '/bin/bash'
        }
      );
      
      return colors.green + '  ✓ ' + colors.reset + 'Packages installed successfully';
    } catch (error) {
      console.error('\n❌ Failed to install packages:', error.message);
      return colors.yellow + '  ⚠️  ' + colors.reset + 'Could not install packages: ' + error.message;
    }
  });
}

module.exports = registerStep9;

