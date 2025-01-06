'use server'

import OpenAI from 'openai'

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set this in your environment variables
})

export async function generateSQLQuery({
  queryDescription,
  schemaInfo,
}: {
  queryDescription: string
  schemaInfo: {
    tablesAndColumns: string
    tableConstraints: string
    foreignKeyReferences: string
  }
}) {
  try {
    const systemPrompt = `You are a SQL query generator for PostgreSQL. Your only task is to generate valid SQL queries based on the user's request.
IMPORTANT: Respond ONLY with the SQL query itself, without any explanations, markdown, or code blocks.
The query must be valid PostgreSQL syntax and ready to execute.

Database Schema Information:
Tables and Columns:
${schemaInfo.tablesAndColumns}

Table Constraints:
${schemaInfo.tableConstraints}

Foreign Key References:
${schemaInfo.foreignKeyReferences}`

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: queryDescription },
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0.1, // Lower temperature for more deterministic outputs
      max_tokens: 500,
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('Error generating SQL query:', error)
    throw error
  }
}
