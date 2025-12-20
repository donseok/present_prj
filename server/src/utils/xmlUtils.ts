/**
 * XML Utilities for processing DOCX/PPTX placeholder parsing
 * 
 * MS Word and PowerPoint often split text across multiple XML tags,
 * fragmenting placeholders like {{프로젝트명}} into separate tags.
 * These utilities help merge fragmented text for proper placeholder detection.
 */

/**
 * Merge fragmented placeholders within XML content.
 * This function handles cases where text is split across multiple runs.
 * 
 * For DOCX: Uses <w:p> (paragraph) and <w:r> (run) and <w:t> (text) tags
 * For PPTX: Uses <a:p> (paragraph) and <a:r> (run) and <a:t> (text) tags
 * 
 * @param xml - The raw XML content
 * @param tagPrefix - 'w' for DOCX, 'a' for PPTX
 * @returns XML with merged placeholders
 */
export function mergeFragmentedPlaceholders(xml: string, tagPrefix: 'w' | 'a'): string {
    const t = tagPrefix // shorthand

    // Pattern to match a paragraph
    const paragraphPattern = new RegExp(`<${t}:p\\b[^>]*>([\\s\\S]*?)<\\/${t}:p>`, 'g')

    return xml.replace(paragraphPattern, (paragraphMatch) => {
        // Extract all text content from this paragraph
        const textPattern = new RegExp(`<${t}:t[^>]*>([^<]*)<\\/${t}:t>`, 'g')
        const textParts: string[] = []
        let match

        while ((match = textPattern.exec(paragraphMatch)) !== null) {
            textParts.push(match[1])
        }

        const combinedText = textParts.join('')

        // Check if the combined text contains complete placeholders
        const placeholderMatches = combinedText.match(/\{\{[^}]+\}\}/g)

        if (!placeholderMatches || placeholderMatches.length === 0) {
            // No complete placeholders found, return original
            return paragraphMatch
        }

        // If we found placeholders, we need to merge the runs
        // Find all runs that contain parts of placeholders
        const runPattern = new RegExp(`<${t}:r\\b[^>]*>([\\s\\S]*?)<\\/${t}:r>`, 'g')
        const runs: { full: string; text: string; hasText: boolean }[] = []

        let runMatch
        while ((runMatch = runPattern.exec(paragraphMatch)) !== null) {
            const runContent = runMatch[0]
            const textMatch = new RegExp(`<${t}:t[^>]*>([^<]*)<\\/${t}:t>`).exec(runContent)
            runs.push({
                full: runContent,
                text: textMatch ? textMatch[1] : '',
                hasText: !!textMatch
            })
        }

        // Merge runs that contain parts of placeholders
        let result = paragraphMatch
        let accumulatedText = ''
        let startRunIndex = -1
        let inPlaceholder = false

        for (let i = 0; i < runs.length; i++) {
            const run = runs[i]
            accumulatedText += run.text

            // Check if we're starting a placeholder
            if (!inPlaceholder && accumulatedText.includes('{{')) {
                startRunIndex = i
                inPlaceholder = true
            }

            // Check if we've completed a placeholder
            if (inPlaceholder && accumulatedText.includes('}}')) {
                // Extract the complete placeholder
                const placeholderMatch = accumulatedText.match(/\{\{[^}]+\}\}/)
                if (placeholderMatch && startRunIndex >= 0) {
                    // Merge runs from startRunIndex to i
                    const firstRun = runs[startRunIndex]
                    const mergedText = placeholderMatch[0]

                    // Replace the text in the first run with the merged placeholder
                    const newFirstRun = firstRun.full.replace(
                        new RegExp(`<${t}:t[^>]*>[^<]*<\\/${t}:t>`),
                        `<${t}:t xml:space="preserve">${mergedText}</${t}:t>`
                    )

                    result = result.replace(firstRun.full, newFirstRun)

                    // Remove subsequent runs that were merged (clear their text content)
                    for (let j = startRunIndex + 1; j <= i; j++) {
                        if (runs[j].hasText) {
                            const clearedRun = runs[j].full.replace(
                                new RegExp(`<${t}:t[^>]*>[^<]*<\\/${t}:t>`),
                                `<${t}:t></${t}:t>`
                            )
                            result = result.replace(runs[j].full, clearedRun)
                        }
                    }
                }

                // Reset for next potential placeholder
                accumulatedText = ''
                startRunIndex = -1
                inPlaceholder = false
            }
        }

        return result
    })
}

/**
 * Extract all text content from XML, ignoring tags.
 * Useful for placeholder detection in fragmented XML.
 * 
 * @param xml - The raw XML content
 * @param tagPrefix - 'w' for DOCX, 'a' for PPTX
 * @returns Plain text content
 */
export function extractTextFromXml(xml: string, tagPrefix: 'w' | 'a'): string {
    const textPattern = new RegExp(`<${tagPrefix}:t[^>]*>([^<]*)<\\/${tagPrefix}:t>`, 'g')
    const parts: string[] = []
    let match

    while ((match = textPattern.exec(xml)) !== null) {
        parts.push(match[1])
    }

    return parts.join('')
}

/**
 * Extract placeholders from XML content, handling fragmented text.
 * This combines text across runs before searching for placeholders.
 * 
 * @param xml - The raw XML content
 * @param tagPrefix - 'w' for DOCX, 'a' for PPTX
 * @returns Array of placeholder names (without {{ }})
 */
export function extractPlaceholdersFromXml(xml: string, tagPrefix: 'w' | 'a'): string[] {
    const text = extractTextFromXml(xml, tagPrefix)
    const placeholders = new Set<string>()
    const regex = /\{\{([^}]+)\}\}/g
    let match

    while ((match = regex.exec(text)) !== null) {
        placeholders.add(match[1].trim())
    }

    return Array.from(placeholders)
}
