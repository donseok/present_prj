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
 * PowerPoint often splits text across multiple <a:t> tags, e.g.,
 * <a:t>{{</a:t><a:t>프로젝트</a:t><a:t>명}}</a:t>
 * This function merges such fragmented placeholders.
 */
function preprocessXml(xml: string): string {
  // Merge consecutive <a:t> tags within the same <a:r> (run)
  // This preserves formatting while allowing placeholder detection
  const runPattern = /<a:r\b[^>]*>([\s\S]*?)<\/a:r>/g
  let result = xml

  result = result.replace(runPattern, (match, runContent) => {
    // Extract all text from <a:t> tags in this run
    const textParts: string[] = []
    const textPattern = /<a:t[^>]*>([^<]*)<\/a:t>/g
    let textMatch
    while ((textMatch = textPattern.exec(runContent)) !== null) {
      textParts.push(textMatch[1])
    }

    const combinedText = textParts.join('')

    // If combined text contains a complete placeholder, merge the <a:t> tags
    if (/\{\{[^}]+\}\}/.test(combinedText)) {
      // Replace all <a:t>...</a:t> sequences with a single merged one
      const mergedRun = runContent.replace(
        /(<a:t[^>]*>)[^<]*<\/a:t>(?:(?:<[^a:t]*>)*<a:t[^>]*>[^<]*<\/a:t>)*/g,
        (_m: string, openTag: string) => {
          return `${openTag}${combinedText}</a:t>`
        }
      )

      // Clean up by keeping only the first <a:t> with merged content
      const firstTextTag = /<a:t[^>]*>[^<]*<\/a:t>/.exec(mergedRun)
      if (firstTextTag) {
        const beforeFirstText = mergedRun.substring(0, mergedRun.indexOf(firstTextTag[0]))
        const afterLastText = mergedRun.substring(mergedRun.lastIndexOf('</a:t>') + 6)
        return `<a:r${match.substring(4, match.indexOf('>'))}>${beforeFirstText}<a:t>${combinedText}</a:t>${afterLastText}</a:r>`
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

export async function generatePptx(project: Project, template: Template): Promise<Buffer> {
  try {
    const fileBuffer = await fs.readFile(template.filePath)
    const zip = await JSZip.loadAsync(fileBuffer)

    // Process all slide XML files
    const slideFiles = Object.keys(zip.files).filter((name) =>
      name.match(/ppt\/slides\/slide\d+\.xml/)
    )

    for (const slidePath of slideFiles) {
      const slideXml = await zip.file(slidePath)?.async('string')
      if (slideXml) {
        zip.file(slidePath, replacePlaceholders(slideXml, project))
      }
    }

    // Process slide layouts
    const layoutFiles = Object.keys(zip.files).filter((name) =>
      name.match(/ppt\/slideLayouts\/slideLayout\d+\.xml/)
    )

    for (const layoutPath of layoutFiles) {
      const layoutXml = await zip.file(layoutPath)?.async('string')
      if (layoutXml) {
        zip.file(layoutPath, replacePlaceholders(layoutXml, project))
      }
    }

    // Process slide masters
    const masterFiles = Object.keys(zip.files).filter((name) =>
      name.match(/ppt\/slideMasters\/slideMaster\d+\.xml/)
    )

    for (const masterPath of masterFiles) {
      const masterXml = await zip.file(masterPath)?.async('string')
      if (masterXml) {
        zip.file(masterPath, replacePlaceholders(masterXml, project))
      }
    }

    const result = await zip.generateAsync({ type: 'nodebuffer' })
    return result
  } catch (error) {
    console.error('Failed to generate PPTX:', error)
    throw error
  }
}
