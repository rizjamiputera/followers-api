#!/usr/bin/env node
// ============================================================
// release-promote.js
//
// Promote the current HEAD commit to production by tagging it
// `v<version>` where <version> is the current package.json
// version. Does NOT bump the version or create a new commit —
// so staging (stg-x.y.z) and production (vx.y.z) point at the
// same commit and the image digest is identical.
//
// Usage (from the `main` branch, after `pnpm release:stg` and a
// successful staging deploy):
//     pnpm release:promote
//     git push origin v<version>
// ============================================================

const { execSync } = require("node:child_process");
const pkg = require("../package.json");

const version = pkg.version;
const tag = `v${version}`;

function run(cmd) {
    return execSync(cmd, { encoding: "utf8" }).trim();
}

// Refuse to promote if the working tree is dirty — the tag must
// land on a clean, committed state.
const status = run("git status --porcelain");
if (status) {
    console.error("ERROR: working tree is dirty. Commit or stash first.");
    process.exit(1);
}

// Refuse to promote if the tag already exists.
try {
    run(`git rev-parse --verify --quiet refs/tags/${tag}`);
    console.error(
        `ERROR: tag ${tag} already exists. Bump the version first (pnpm release:stg).`,
    );
    process.exit(1);
} catch {
    // rev-parse returns non-zero when the tag is missing — that's what we want.
}

const sha = run("git rev-parse --short HEAD");
execSync(`git tag ${tag} -m "release: ${tag}"`, { stdio: "inherit" });

console.log("");
console.log(`  Tagged ${tag} on commit ${sha}`);
console.log(`  Next step: git push origin ${tag}`);
console.log("");
