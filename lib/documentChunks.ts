const DEFAULT_CHUNK_SIZE = 2400;
const DEFAULT_CHUNK_OVERLAP = 250;

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findChunkEnd(
  text: string,
  start: number,
  maxEnd: number,
  chunkSize: number
) {
  const paragraphEnd = text.lastIndexOf("\n\n", maxEnd);

  if (paragraphEnd > start + chunkSize * 0.45) {
    return paragraphEnd;
  }

  const sentenceEnd = Math.max(
    text.lastIndexOf(". ", maxEnd),
    text.lastIndexOf("? ", maxEnd),
    text.lastIndexOf("! ", maxEnd)
  );

  if (sentenceEnd > start + chunkSize * 0.45) {
    return sentenceEnd + 1;
  }

  const wordEnd = text.lastIndexOf(" ", maxEnd);
  return wordEnd > start ? wordEnd : maxEnd;
}

export function chunkText(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_CHUNK_OVERLAP
) {
  const normalizedText = normalizeText(text);

  if (!normalizedText) {
    return [];
  }

  if (normalizedText.length <= chunkSize) {
    return [normalizedText];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < normalizedText.length) {
    const maxEnd = Math.min(start + chunkSize, normalizedText.length);
    const end =
      maxEnd === normalizedText.length
        ? normalizedText.length
        : findChunkEnd(normalizedText, start, maxEnd, chunkSize);
    const chunk = normalizedText.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end === normalizedText.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}
