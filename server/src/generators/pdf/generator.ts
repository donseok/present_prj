import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Project, Template } from '../../types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Korean font path configuration
// Place a Korean TTF font file (e.g., NotoSansKR-Regular.ttf) in assets/fonts/
const KOREAN_FONT_PATH = path.join(__dirname, '../../assets/fonts/NotoSansKR-Regular.ttf')

function getKoreanFontPath(): string | null {
  if (fs.existsSync(KOREAN_FONT_PATH)) {
    return KOREAN_FONT_PATH
  }
  // Check alternative locations
  const alternativePaths = [
    path.join(__dirname, '../../assets/fonts/NotoSansKR-Regular.otf'),
    path.join(__dirname, '../../assets/fonts/NanumGothic.ttf'),
    path.join(__dirname, '../../assets/fonts/MalgunGothic.ttf'),
  ]
  for (const altPath of alternativePaths) {
    if (fs.existsSync(altPath)) {
      return altPath
    }
  }
  return null
}

export async function generatePdf(project: Project, template: Template): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const chunks: Buffer[] = []
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `${project.name} - ${template.documentType}`,
          Author: 'DocuGen',
          Subject: template.documentType,
        }
      })

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Register Korean font if available, otherwise use Helvetica with warning
      const koreanFontPath = getKoreanFontPath()
      if (koreanFontPath) {
        doc.registerFont('Korean', koreanFontPath)
        doc.font('Korean')
      } else {
        console.warn('[PDF Generator] Korean font not found. Korean text will not render properly.')
        console.warn('[PDF Generator] Place a Korean TTF font (e.g., NotoSansKR-Regular.ttf) in server/src/assets/fonts/')
        doc.font('Helvetica')
      }

      // Header with gradient-like styling
      doc.rect(0, 0, doc.page.width, 80).fill('#1a1a2e')
      if (koreanFontPath) doc.font('Korean')
      else doc.font('Helvetica')
      doc.fontSize(24).fillColor('#a855f7').text('DocuGen', 50, 30)
      doc.fontSize(10).fillColor('#888888').text('Smart Document Generator', 50, 55)

      // Document Title
      doc.moveDown(3)
      doc.fontSize(28).fillColor('#333333').text(template.documentType, { align: 'center' })
      doc.moveDown(0.5)
      doc.fontSize(18).fillColor('#666666').text(project.name, { align: 'center' })

      // Divider
      doc.moveDown(2)
      const lineY = doc.y
      doc.moveTo(50, lineY).lineTo(doc.page.width - 50, lineY).stroke('#a855f7')
      doc.moveDown(2)

      // Project Information Section
      doc.fontSize(16).fillColor('#a855f7').text('프로젝트 정보', 50)
      doc.moveDown(0.5)

      const infoItems = [
        { label: '프로젝트명', value: project.name },
        { label: '고객사', value: project.client },
        { label: '시작일', value: project.startDate },
        { label: '종료일', value: project.endDate },
        { label: '상태', value: project.status },
      ]

      doc.fontSize(11).fillColor('#333333')
      infoItems.forEach(item => {
        doc.font('Helvetica-Bold').text(`${item.label}: `, { continued: true })
        doc.font('Helvetica').text(item.value || '-')
      })

      // Description Section
      if (project.description) {
        doc.moveDown(1.5)
        doc.fontSize(16).fillColor('#a855f7').text('프로젝트 설명', 50)
        doc.moveDown(0.5)
        doc.fontSize(11).fillColor('#333333').text(project.description, { align: 'justify' })
      }

      // Scope Section
      if (project.scope) {
        doc.moveDown(1.5)
        doc.fontSize(16).fillColor('#a855f7').text('프로젝트 범위', 50)
        doc.moveDown(0.5)
        doc.fontSize(11).fillColor('#333333').text(project.scope, { align: 'justify' })
      }

      // Team Section
      if (project.team && project.team.length > 0) {
        doc.moveDown(1.5)
        doc.fontSize(16).fillColor('#a855f7').text('팀 구성', 50)
        doc.moveDown(0.5)

        project.team.forEach((member, index) => {
          doc.fontSize(11).fillColor('#333333')
          doc.font('Helvetica-Bold').text(`${index + 1}. ${member.name}`, { continued: true })
          doc.font('Helvetica').text(` (${member.role})`)
          if (member.responsibility) {
            doc.fontSize(10).fillColor('#666666').text(`   담당: ${member.responsibility}`)
          }
        })
      }

      // Milestones Section
      if (project.milestones && project.milestones.length > 0) {
        doc.moveDown(1.5)
        doc.fontSize(16).fillColor('#a855f7').text('마일스톤', 50)
        doc.moveDown(0.5)

        project.milestones.forEach((milestone, index) => {
          doc.fontSize(11).fillColor('#333333')
          doc.font('Helvetica-Bold').text(`${index + 1}. ${milestone.name}`, { continued: true })
          doc.font('Helvetica').text(` - ${milestone.date}`)
          if (milestone.deliverables) {
            doc.fontSize(10).fillColor('#666666').text(`   산출물: ${milestone.deliverables}`)
          }
        })
      }

      // Footer
      const pages = doc.bufferedPageRange()
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i)

        // Footer line
        doc.moveTo(50, doc.page.height - 50)
          .lineTo(doc.page.width - 50, doc.page.height - 50)
          .stroke('#dddddd')

        // Footer text
        doc.fontSize(9).fillColor('#888888')
        doc.text(
          `DocuGen - ${template.documentType}`,
          50,
          doc.page.height - 40,
          { align: 'left', width: doc.page.width - 100 }
        )
        doc.text(
          `Page ${i + 1} of ${pages.count}`,
          50,
          doc.page.height - 40,
          { align: 'right', width: doc.page.width - 100 }
        )
      }

      doc.end()
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      reject(error)
    }
  })
}
