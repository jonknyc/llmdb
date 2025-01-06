'use server'

import { Client } from 'pg'

export async function getSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  await client.connect()

  const tablesAndColumns = await client.query(`
    SELECT
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'  -- or your target schema(s)
    ORDER BY table_name, ordinal_position;
  `)

  const tableConstraints = await client.query(`
    SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name = kcu.table_name
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name;
  `)

  const foreignKeyReferences = await client.query(`
    SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name   AS foreign_table_name,
        ccu.column_name  AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `)

  await client.end()

  return {
    tablesAndColumns: [
      [
        'table_name',
        'column_name',
        'data_type',
        'is_nullable',
        'column_default',
      ].join(','),
      ...tablesAndColumns.rows.map((row) => Object.values(row).join(',')),
    ].join('\n'),
    tableConstraints: [
      ['table_name', 'constraint_name', 'constraint_type', 'column_name'].join(
        ','
      ),
      ...tableConstraints.rows.map((row) => Object.values(row).join(',')),
    ].join('\n'),
    foreignKeyReferences: [
      [
        'table_name',
        'constraint_name',
        'column_name',
        'foreign_table_name',
        'foreign_column_name',
      ].join(','),
      ...foreignKeyReferences.rows.map((row) => Object.values(row).join(',')),
    ].join('\n'),
  }
}

export async function runQuery(query: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  await client.connect()
  try {
    // Start transaction
    await client.query('BEGIN')

    // Split the query into individual statements and filter out empty ones
    const statements = query.split(';').filter((stmt) => stmt.trim())
    let lastResult

    // Execute each statement sequentially
    for (const stmt of statements) {
      lastResult = await client.query(stmt)
    }

    // Commit the transaction
    await client.query('COMMIT')

    // Use the last result for output
    if (!lastResult || lastResult.rows.length === 0) {
      return 'ok'
    }

    return [
      lastResult.fields.map((field) => field.name).join(','),
      ...lastResult.rows.map((row) => Object.values(row).join(',')),
    ].join('\n')
  } catch (error) {
    // Rollback the transaction on error
    await client.query('ROLLBACK')
    if (error instanceof Error) {
      return error.message
    }
    return 'An unknown error occurred'
  } finally {
    await client.end()
  }
}
