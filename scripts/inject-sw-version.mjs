// Post-build script: inject BUILD_VERSION into sw.js in /out directory
// This ensures every deploy has a unique cache name, busting old PWA caches
import { readFileSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Generate version: pkg version + timestamp (short)
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const ts = Date.now().toString(36) // base36 timestamp — short & unique
const version = `${pkg.version}-${ts}`

const swPath = join(root, 'out', 'sw.js')
let sw = readFileSync(swPath, 'utf8')

// Replace the placeholder line with the actual version
sw = sw.replace(
  /const BUILD_VERSION = self\.__BUILD_VERSION__.*$/m,
  `const BUILD_VERSION = '${version}'; // injected at build time`
)

writeFileSync(swPath, sw)
console.log(`[inject-sw-version] Cache version: easy-calories-${version}`)
