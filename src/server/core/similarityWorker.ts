import stringSimilarity from 'string-similarity';

export default function calculateSimilarity(data: { text1: string, text2: string }): number {
  return stringSimilarity.compareTwoStrings(data.text1 || "", data.text2 || "");
}