export function sanitizePrompt(prompt: string): string {
  // AI Firewall: Prevent prompt injections & malicious queries
  const maliciousPatterns = [
    /ignore (all )?(previous )?(instructions|directions)/i,
    /sys(tem)?\s?prompt/i,
    /bypass\s?(security|firewall)?/i,
    /(show|reveal|print)\s?(me )?(your )?(api )?key/i,
    />\s?cat\s?\/etc\/shadow/i,
    /drop\s?table/i
  ];

  for (const pattern of maliciousPatterns) {
    if (pattern.test(prompt)) {
      throw new Error("SECURITY FIREWALL (ZTA): Tentative d'injection ou commande malveillante détectée et bloquée.");
    }
  }

  return prompt; // Valid
}
