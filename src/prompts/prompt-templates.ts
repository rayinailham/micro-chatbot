export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  description: string;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "greeting",
    name: "Initial Greeting",
    category: "conversation-flow",
    template: "Halo! Saya AI Assistant {{service_name}}. Ada yang bisa saya bantu hari ini?",
    variables: ["service_name"],
    description: "Sapaan awal untuk memulai percakapan"
  },
  
  {
    id: "clarification",
    name: "Request Clarification", 
    category: "conversation-flow",
    template: "Maaf, saya perlu klarifikasi lebih lanjut tentang {{topic}}. Bisakah Anda jelaskan lebih detail mengenai {{specific_aspect}}?",
    variables: ["topic", "specific_aspect"],
    description: "Meminta klarifikasi ketika informasi tidak jelas"
  },
  
  {
    id: "escalation",
    name: "Escalate to Human",
    category: "escalation", 
    template: "Terima kasih atas kesabaran Anda. Saya akan menghubungkan Anda dengan specialist kami sekarang untuk penanganan yang lebih baik.",
    variables: [],
    description: "Eskalasi ke customer service manusia"
  },
  
  {
    id: "confirmation",
    name: "Confirm Information",
    category: "conversation-flow",
    template: "Baik, saya konfirmasi bahwa {{information}}. Apakah ini sudah benar?",
    variables: ["information"],
    description: "Konfirmasi informasi yang diberikan pengguna"
  },
  
  {
    id: "solution-provided",
    name: "Solution Provided",
    category: "resolution",
    template: "Saya sudah {{action}}. Apakah ada hal lain yang bisa saya bantu?",
    variables: ["action"],
    description: "Konfirmasi setelah memberikan solusi"
  }
];

/**
 * Replace template variables with actual values
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object with variable names as keys and values as values
 * @returns Processed template string
 */
export function processTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}

/**
 * Get template by ID
 * @param id - Template ID
 * @returns Template object or undefined
 */
export function getTemplateById(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find(template => template.id === id);
}

/**
 * Get templates by category
 * @param category - Template category
 * @returns Array of templates in the category
 */
export function getTemplatesByCategory(category: string): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter(template => template.category === category);
}

