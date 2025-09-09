#!/usr/bin/env node

// Simple script to verify Chromium installation
const fs = require('fs');

console.log('🔍 Verifying Chromium installation...');

const possiblePaths = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium', 
    '/usr/local/bin/chromium'
];

let foundPath = null;

for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
        console.log(`✅ Found Chromium at: ${path}`);
        foundPath = path;
        break;
    } else {
        console.log(`❌ Not found: ${path}`);
    }
}

if (foundPath) {
    console.log(`🎯 PUPPETEER_EXECUTABLE_PATH should be: ${foundPath}`);
    
    // Try to get version
    try {
        const { execSync } = require('child_process');
        const version = execSync(`${foundPath} --version`, { encoding: 'utf8' });
        console.log(`📋 Version: ${version.trim()}`);
    } catch (error) {
        console.log(`⚠️  Could not get version: ${error.message}`);
    }
} else {
    console.log('❌ No Chromium executable found!');
    console.log('📋 Available binaries in /usr/bin:');
    try {
        const binaries = fs.readdirSync('/usr/bin').filter(f => f.includes('chrom'));
        console.log(binaries);
    } catch (error) {
        console.log('Could not read /usr/bin directory');
    }
}