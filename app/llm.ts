'use server'

import OpenAI from 'openai'
import { SchemaInfo } from './types'

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set this in your environment variables
})

export async function generateSqlQuery({
  queryDescription,
  schemaInfo,
}: {
  queryDescription: string
  schemaInfo: SchemaInfo
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

export async function generateErDiagram({
  schemaInfo,
}: {
  schemaInfo: SchemaInfo
}) {
  try {
    const systemPrompt = `You are an ER diagram generator. Your task is to create an ASCII-based Entity-Relationship diagram based on the provided database schema.
IMPORTANT: Respond ONLY with the ASCII ER diagram, without any explanations, markdown, or code blocks.
Use standard ER diagram notation with boxes for entities, lines for relationships, and proper cardinality markers (1:N, N:N, 1:1).

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
        {
          role: 'user',
          content: 'Generate an ASCII ER diagram for this database schema.',
        },
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0.1,
      max_tokens: 1000, // Increased token limit for larger diagrams
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('Error generating ER diagram:', error)
    throw error
  }
}
