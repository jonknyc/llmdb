import mermaid from 'mermaid'

/**
 * Generates an ER diagram from Mermaid markup
 * @param markup - The Mermaid ER diagram markup
 * @returns The SVG of the ER diagram
 */
export async function generateErDiagram(markup: string): Promise<string> {
  try {
    // Initialize mermaid with default configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose', // Adjust based on your security needs
    })

    // Generate and insert the diagram
    const { svg } = await mermaid.render(`mermaid-${Date.now()}`, markup)
    console.log('\nER diagram SVG:')
    console.log(svg)
    return svg
  } catch (error) {
    console.error('Error generating ER diagram:', error)
    throw error
  }
}
