/**
 * Generate unique SKU for Pokemon cards
 * Format: PKM-{SET}-{NUMBER}-{RANDOM}
 * Example: PKM-SCA-025-A3F
 */
export function generateSKU(cardSet?: string, cardNumber?: string): string {
  // Extract set code (first 3 chars, uppercase, alphanumeric only)
  const setCode = cardSet
    ? cardSet
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .padEnd(3, 'X')
    : 'UNK'
  
  // Use card number or timestamp
  const num = cardNumber
    ? cardNumber.replace(/[^0-9]/g, '').padStart(3, '0').substring(0, 3)
    : Date.now().toString().slice(-6)
  
  // Random alphanumeric suffix for uniqueness
  const random = Math.random()
    .toString(36)
    .substring(2, 5)
    .toUpperCase()
  
  return `PKM-${setCode}-${num}-${random}`
}

/**
 * Generate URL-friendly slug from product name
 * Example: "Pikachu ex" -> "pikachu-ex"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .trim()
}

/**
 * Generate unique slug by appending number if exists
 */
export async function generateUniqueSlug(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any
): Promise<string> {
  let slug = generateSlug(name)
  let counter = 1
  const maxAttempts = 100
  
  while (counter < maxAttempts) {
    const exists = await prisma.product.findUnique({
      where: { slug }
    })
    
    if (!exists) return slug
    
    slug = `${generateSlug(name)}-${counter}`
    counter++
  }
  
  // Fallback: append timestamp if max attempts reached
  return `${generateSlug(name)}-${Date.now()}`
}
