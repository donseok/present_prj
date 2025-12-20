import fs from 'fs/promises'
import JSZip from 'jszip'
import { extractPlaceholdersFromXml } from '../utils/xmlUtils.js'

/**
 * Extract placeholders from a DOCX or PPTX template file.
 * This function handles XML fragmentation where placeholders like {{프로젝트명}}
 * may be split across multiple XML tags.
 */
export async function extractPlaceholders(
  filePath: string,
  format: 'docx' | 'pptx'
): Promise<string[]> {
  try {
    const fileBuffer = await fs.readFile(filePath)
    const zip = await JSZip.loadAsync(fileBuffer)

    const allPlaceholders = new Set<string>()

    if (format === 'docx') {
      // For DOCX, read document.xml, headers, and footers
      const docFiles = Object.keys(zip.files).filter((name) =>
        name.match(/word\/(document|header\d+|footer\d+)\.xml/)
      )

      for (const docPath of docFiles) {
        const xml = await zip.file(docPath)?.async('string')
        if (xml) {
          const placeholders = extractPlaceholdersFromXml(xml, 'w')
          placeholders.forEach(p => allPlaceholders.add(p))
        }
      }
    } else {
      // For PPTX, read all slide, slideLayout, and slideMaster XML files
      const slideFiles = Object.keys(zip.files).filter((name) =>
        name.match(/ppt\/(slides\/slide|slideLayouts\/slideLayout|slideMasters\/slideMaster)\d+\.xml/)
      )

      for (const slidePath of slideFiles) {
        const xml = await zip.file(slidePath)?.async('string')
        if (xml) {
          const placeholders = extractPlaceholdersFromXml(xml, 'a')
          placeholders.forEach(p => allPlaceholders.add(p))
        }
      }
    }

    return Array.from(allPlaceholders)
  } catch (error) {
    console.error('Failed to extract placeholders:', error)
    return []
  }
}
