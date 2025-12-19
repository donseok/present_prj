import fs from 'fs/promises'
import JSZip from 'jszip'

const PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g

export async function extractPlaceholders(
  filePath: string,
  format: 'docx' | 'pptx'
): Promise<string[]> {
  try {
    const fileBuffer = await fs.readFile(filePath)
    const zip = await JSZip.loadAsync(fileBuffer)

    let textContent = ''

    if (format === 'docx') {
      // For DOCX, read document.xml
      const documentXml = await zip.file('word/document.xml')?.async('string')
      if (documentXml) {
        textContent = documentXml
      }
    } else {
      // For PPTX, read all slide XML files
      const slideFiles = Object.keys(zip.files).filter((name) =>
        name.match(/ppt\/slides\/slide\d+\.xml/)
      )
      for (const slideName of slideFiles) {
        const slideContent = await zip.file(slideName)?.async('string')
        if (slideContent) {
          textContent += slideContent
        }
      }
    }

    // Extract placeholders
    const placeholders = new Set<string>()
    let match
    while ((match = PLACEHOLDER_REGEX.exec(textContent)) !== null) {
      placeholders.add(match[1])
    }

    return Array.from(placeholders)
  } catch (error) {
    console.error('Failed to extract placeholders:', error)
    return []
  }
}
