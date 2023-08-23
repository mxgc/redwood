import path from 'node:path'

import execa from 'execa'
import fs from 'fs-extra'
import { Listr } from 'listr2'

import { getPaths } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../lib/colors'

export async function handler() {
  const redwoodProjectPaths = getPaths()

  const tasks = new Listr(
    [
      {
        title: 'Creating the dataMigrations directory...',
        task() {
          fs.outputFileSync(
            path.join(redwoodProjectPaths.api.dataMigrations, '.keep'),
            ''
          )
        },
      },
      {
        title: 'Adding the RW_DataMigration model to schema.prisma...',
        task() {
          const dbSchemaPath = redwoodProjectPaths.api.dbSchema
          const dbSchema = fs.readFileSync(dbSchemaPath, 'utf-8')
          fs.writeFileSync(
            dbSchemaPath,
            [dbSchema, RW_DATA_MIGRATION_MODEL, ''].join('\n')
          )
        },
      },
      {
        title: 'Creating the database migration...',
        task() {
          return execa.command(createDatabaseMigrationCommand, {
            cwd: redwoodProjectPaths.api.base,
          })
        },
      },
      {
        title: 'One more thing...',
        task(_ctx, task) {
          task.title = [
            'Next steps:',
            c.warning(
              "Don't forget to apply your migration when you're ready:"
            ),
            c.bold('yarn rw prisma migrate dev'),
          ].join('\n')
        },
      },
    ],
    {
      rendererOptions: {
        collapseSubtasks: false,
      },
      exitOnError: true,
    }
  )

  try {
    await tasks.run()
  } catch (e) {
    process.exitCode = 1
    console.error(c.error((e as Error).message))
    errorTelemetry(process.argv, (e as Error).message)
  }
}

export const RW_DATA_MIGRATION_MODEL = `\
model RW_DataMigration {
  version    String   @id
  name       String
  startedAt  DateTime
  finishedAt DateTime
}`

export const createDatabaseMigrationCommand =
  'yarn rw prisma migrate dev --name create_data_migrations --create-only'
