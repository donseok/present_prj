import fs from 'fs/promises'
import JSZip from 'jszip'
import type { Project, Template } from '../../types/index.js'
import { mergeFragmentedPlaceholders } from '../../utils/xmlUtils.js'

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


function replacePlaceholders(content: string, project: Project): string {
  // Preprocess XML to merge fragmented placeholders using the new utility
  const preprocessedContent = mergeFragmentedPlaceholders(content, 'w')

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
