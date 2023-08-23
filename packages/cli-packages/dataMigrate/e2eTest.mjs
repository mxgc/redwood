/* eslint-env node */

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import chalk from 'chalk'
import execa from 'execa'

const distPath = fileURLToPath(new URL('./dist', import.meta.url))
const binPath = path.join(distPath, 'bin.js')

const command = `node ${binPath}`

async function main() {
  const testProjectPath =
    process.env.REDWOOD_TEST_PROJECT_PATH ?? process.env.PROJECT_PATH

  // Handle there being no test project to run against.
  if (testProjectPath === undefined) {
    process.exitCode = 1
    console.error(
      [
        chalk.red('Error: No test project to run against.'),
        "If you haven't generated a test project, do so first via...",
        '',
        '  yarn build:test-project --link <your test project path>',
        '',
        `Then set the ${chalk.magenta(
          'REDWOOD_TEST_PROJECT_PATH'
        )} env var to the path of your test project and run this script again.`,
      ].join('\n')
    )
    return
  }

  process.chdir(testProjectPath)

  // Help works.
  execa.commandSync(`${command} --help`, {
    stdio: 'inherit',
  })

  // Should be no pending migrations.
  execa.commandSync(`${command} up`, {
    stdio: 'inherit',
  })

  // run dataMigrate install
  // run g dataMigrate wip
  // run up
}

await main()
