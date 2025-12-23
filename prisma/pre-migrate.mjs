import pg from 'pg'

async function preMigrate() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.log('DATABASE_URL not set, skipping pre-migration')
    return
  }

  console.log('Running pre-migration to clear old condition values...')

  const client = new pg.Client({
    connectionString: databaseUrl,
  })

  try {
    await client.connect()

    // Clear old condition values to allow enum change
    const result = await client.query(`
      UPDATE "Product"
      SET "condition" = NULL
      WHERE "condition" IS NOT NULL
    `)

    console.log(`Pre-migration completed. Updated ${result.rowCount} rows.`)

  } catch (error) {
    // If table doesn't exist or already migrated, continue
    console.log('Pre-migration note:', error.message)
  } finally {
    await client.end()
  }
}

preMigrate().catch(console.error)
