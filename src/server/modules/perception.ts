// src/server/modules/perception.ts
import multer from 'multer';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { eventBus } from '../core/eventBus';
import { dbOps } from '../core/database';
import { auditLog } from '../core/security';

// Upload temporaire en mémoire
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non supporté: ${file.mimetype}`));
    }
  }
});

export async function processImageWithVision(
  imageBuffer: Buffer,
  mimeType: string,
  prompt: string,
  apiKey: string
): Promise<string> {
  // Utilise l'API Gemini Vision existante — pas de lib supplémentaire
  const base64 = imageBuffer.toString('base64');
  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt || "Décris ce que tu vois dans cette image en détail." },
          { inline_data: { mime_type: mimeType, data: base64 } }
        ]
      }]
    })
  });

  if (!response.ok) throw new Error(`Vision API Error: ${response.status}`);
  const data = await response.json();

  eventBus.publish('PERCEPTION_VISION_ANALYZED', {
    type: 'image',
    prompt: prompt.substring(0, 50)
  });

  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Aucune description disponible';
}

export async function processPDF(buffer: Buffer, filename: string): Promise<string[]> {
  // pdf-parse extrait le vrai texte du PDF
  const data = await pdfParse(buffer);
  const fullText = data.text;

  // Découpage en chunks de 1000 caractères avec overlap de 100
  const chunkSize = 1000;
  const overlap = 100;
  const chunks: string[] = [];

  for (let i = 0; i < fullText.length; i += chunkSize - overlap) {
    const chunk = fullText.slice(i, i + chunkSize).trim();
    if (chunk.length > 50) chunks.push(chunk);
  }

  eventBus.publish('PERCEPTION_DOCUMENT_INGESTED', {
    filename,
    pages: data.numpages,
    chunks: chunks.length
  });

  auditLog('DOCUMENT_INGESTED', 'system', { filename, pages: data.numpages });
  return chunks;
}

export async function processTextFile(buffer: Buffer, filename: string): Promise<string[]> {
  const text = buffer.toString('utf-8');
  const lines = text.split('\n').filter(l => l.trim().length > 0);

  // Grouper par blocs de 50 lignes
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += 50) {
    chunks.push(lines.slice(i, i + 50).join('\n'));
  }

  eventBus.publish('PERCEPTION_DOCUMENT_INGESTED', {
    filename,
    lines: lines.length,
    chunks: chunks.length
  });

  return chunks;
}
