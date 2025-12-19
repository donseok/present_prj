import fs from 'fs/promises'
import JSZip from 'jszip'
import type { Project, Template } from '../../types/index.js'

const PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g

function getPlaceholderValue(key: string, project: Project): string {
  const keyMap: Record<string, string | undefined> = {
    '프로젝트명': project.name,
    '고객사': project.client,
    '설명': project.description,
    '범위': project.scope,
    '시작일': project.startDate,
    '종료일': project.endDate,
    '상태': project.status,
    '팀원수': String(project.team.length),
    '마일스톤수': String(project.milestones.length),
  }

  // Handle team members as list
  if (key === '팀원목록') {
    return project.team
      .map((m) => `${m.name} (${m.role}): ${m.responsibility}`)
      .join('\n')
  }

  // Handle milestones as list
  if (key === '마일스톤목록') {
    return project.milestones
      .map((m) => `${m.name} - ${m.date}: ${m.deliverables}`)
      .join('\n')
  }

  return keyMap[key] ?? `{{${key}}}`
}

/**
 * Preprocess XML to merge fragmented placeholders.
 * MS Word often splits text across multiple <w:t> tags, e.g.,
 * <w:t>{{</w:t><w:t>프로젝트</w:t><w:t>명}}</w:t>
 * This function merges such fragmented placeholders.
 */
function preprocessXml(xml: string): string {
  // Merge consecutive <w:t> tags within the same <w:r> (run)
  // This preserves formatting while allowing placeholder detection
  const runPattern = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g
  let result = xml

  result = result.replace(runPattern, (match, runContent) => {
    // Extract all text from <w:t> tags in this run
    const textParts: string[] = []
    const textPattern = /<w:t[^>]*>([^<]*)<\/w:t>/g
    let textMatch
    while ((textMatch = textPattern.exec(runContent)) !== null) {
      textParts.push(textMatch[1])
    }

    const combinedText = textParts.join('')

    // If combined text contains a complete placeholder, merge the <w:t> tags
    if (/\{\{[^}]+\}\}/.test(combinedText)) {
      // Replace all <w:t>...</w:t> sequences with a single merged one
      const mergedRun = runContent.replace(
        /(<w:t[^>]*>)[^<]*<\/w:t>(?:(?:<[^w:t]*>)*<w:t[^>]*>[^<]*<\/w:t>)*/g,
        (_m: string, openTag: string) => {
          // Only replace if this is part of the fragmented placeholder
          return `${openTag}${combinedText}</w:t>`
        }
      )

      // Clean up by keeping only the first <w:t> with merged content
      const firstTextTag = /<w:t[^>]*>[^<]*<\/w:t>/.exec(mergedRun)
      if (firstTextTag) {
        const beforeFirstText = mergedRun.substring(0, mergedRun.indexOf(firstTextTag[0]))
        const afterLastText = mergedRun.substring(mergedRun.lastIndexOf('</w:t>') + 6)
        return `<w:r${match.substring(4, match.indexOf('>'))}>${beforeFirstText}<w:t xml:space="preserve">${combinedText}</w:t>${afterLastText}</w:r>`
      }
    }

    return match
  })

  return result
}

function replacePlaceholders(content: string, project: Project): string {
  // Preprocess XML to merge fragmented placeholders
  const preprocessedContent = preprocessXml(content)

  return preprocessedContent.replace(PLACEHOLDER_REGEX, (_match, key) => {
    return getPlaceholderValue(key.trim(), project)
  })
}

export async function generateDocx(project: Project, template: Template): Promise<Buffer> {
  try {
    const fileBuffer = await fs.readFile(template.filePath)
    const zip = await JSZip.loadAsync(fileBuffer)

    // Process document.xml
    const documentXmlPath = 'word/document.xml'
    const documentXml = await zip.file(documentXmlPath)?.async('string')

    if (documentXml) {
      const processedXml = replacePlaceholders(documentXml, project)
      zip.file(documentXmlPath, processedXml)
    }

    // Process headers
    const headerFiles = Object.keys(zip.files).filter((name) =>
      name.match(/word\/header\d+\.xml/)
    )
    for (const headerPath of headerFiles) {
      const headerXml = await zip.file(headerPath)?.async('string')
      if (headerXml) {
        zip.file(headerPath, replacePlaceholders(headerXml, project))
      }
    }

    // Process footers
    const footerFiles = Object.keys(zip.files).filter((name) =>
      name.match(/word\/footer\d+\.xml/)
    )
    for (const footerPath of footerFiles) {
      const footerXml = await zip.file(footerPath)?.async('string')
      if (footerXml) {
        zip.file(footerPath, replacePlaceholders(footerXml, project))
      }
    }

    const result = await zip.generateAsync({ type: 'nodebuffer' })
    return result
  } catch (error) {
    console.error('Failed to generate DOCX:', error)
    throw error
  }
}
