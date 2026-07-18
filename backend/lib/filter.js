// backend/lib/filter.js

import { prisma } from './prisma.js';

let bannedWordsCache = [];
let lastFetched = 0;

const getBannedWords = async () => {
  const now = Date.now();
  // 10-second cache refresh
  if (bannedWordsCache.length > 0 && now - lastFetched < 10000) {
    return bannedWordsCache;
  }

  try {
    const rows = await prisma.prohibitedWord.findMany({ select: { word: true } });
    bannedWordsCache = rows.map((row) => row.word.toLowerCase());
    lastFetched = now;
  } catch (err) {
    // On DB error, fall back to the last known cache so the filter never crashes
    // the request path. Log for observability.
    console.error('Failed to load prohibited words:', err);
  }
  return bannedWordsCache;
};

// Enhanced normalization to catch accent and special character substitutions.
const normalizeText = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    
    // 1. Remove Accents/Diacritics
    // Decomposes combined characters (like 'ñ' to 'n' + '~') and removes the marks.
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') 

    // 2. Comprehensive Special Character & Leetspeak Mapping
    // Replaces symbols that look like letters.
    .replace(/[04@Âåâãàáä]/g, 'a')
    .replace(/[3€êëèé]/g, 'e')
    .replace(/[1!|¡ïîìí]/g, 'i')
    .replace(/[0øõôòóö]/g, 'o')
    .replace(/[5$§]/g, 's')
    .replace(/[7+†]/g, 't')
    .replace(/8/g, 'b')
    .replace(/[96]/g, 'g')
    .replace(/[vµ]/g, 'u') // Catches 'v' used as 'u'
    .replace(/ñ/g, 'n')
    .replace(/ç/g, 'c')
    
    // 3. Clean up
    // Removes all remaining non-alphabetic characters.
    .replace(/[^a-z\s]/g, '');
};

export const isOffensive = async (text) => {
  if (!text) return false;
  
  const bannedWords = await getBannedWords();
  const cleanText = normalizeText(text);
  
  const tokenizer = { tokenize: (s) => s.split(/\s+/).filter(Boolean) };
  const tokens = tokenizer.tokenize(cleanText);

  // Check 1: Direct Token Match (Handles reversed and collapsed letters)
  const hasBannedToken = tokens.some(token => {
    const collapsed = token.replace(/(.)\1+/g, '$1'); // 'gaaaago' -> 'gago'
    const reversed = token.split('').reverse().join(''); // 'ogag' -> 'gago'
    const collapsedReversed = collapsed.split('').reverse().join('');

    return (
      bannedWords.includes(token) || 
      bannedWords.includes(collapsed) || 
      bannedWords.includes(reversed) ||
      bannedWords.includes(collapsedReversed)
    );
  });

  if (hasBannedToken) return true;

  // Check 2: Substring Match for hidden words across the whole string
  const spacelessText = cleanText.replace(/\s+/g, '');
  const reversedSpaceless = spacelessText.split('').reverse().join('');

  const singleWords = bannedWords.filter(b => !b.includes(' '));
  const phrases = bannedWords.filter(b => b.includes(' '));

  // Single-word check (existing behavior).
  const hasBannedWord = singleWords.some(banned => {
    if (banned.length < 3) return false;
    return spacelessText.includes(banned) || reversedSpaceless.includes(banned);
  });

  if (hasBannedWord) return true;

  // Check 3: Multi-word phrase match (e.g. "mag kano", "putang ina").
  // Collapse spaces in both the phrase and the text so spacing tricks
  // (extra spaces, missing spaces) still match.
  return phrases.some(phrase => {
    const normPhrase = phrase.replace(/\s+/g, ' ').trim();
    if (normPhrase.length < 3) return false;
    const spacelessPhrase = normPhrase.replace(/\s+/g, '');
    return spacelessText.includes(spacelessPhrase) || reversedSpaceless.includes(spacelessPhrase);
  });
};
