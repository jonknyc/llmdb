export type SchemaInfo = {
  tablesAndColumns: string
  tableConstraints: string
  foreignKeyReferences: string
}

export type Message = {
  message: string
  role: 'user' | 'assistant' | 'database'
}
