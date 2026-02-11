// backend/lib/filter.js

import { supabase } from './supabase.js';
import natural from 'natural';

let bannedWordsCache = [];
let lastFetched = 0;

const getBannedWords = async () => {
  const now = Date.now();
  // 10-second cache refresh as requested
  if (bannedWordsCache.length > 0 && now - lastFetched < 10000) {
    return bannedWordsCache;
  }

  const { data } = await supabase.from('prohibited_words').select('word');
  bannedWordsCache = data?.map(row => row.word.toLowerCase()) || [];
  lastFetched = now;
  return bannedWordsCache;
};

/**
 * Enhanced normalization to catch accent and special character substitutions.
 */
const normalizeText = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    /**
     * 1. Remove Accents/Diacritics
     * Decomposes combined characters (like 'ñ' to 'n' + '~') and removes the marks.
     */
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') 

    /**
     * 2. Comprehensive Special Character & Leetspeak Mapping
     * Replaces symbols that look like letters.
     */
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
    
    /**
     * 3. Clean up
     * Removes all remaining non-alphabetic characters.
     */
    .replace(/[^a-z\s]/g, '');
};

export const isOffensive = async (text) => {
  if (!text) return false;
  
  const bannedWords = await getBannedWords();
  const cleanText = normalizeText(text);
  
  const tokenizer = new natural.WordTokenizer();
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

  return bannedWords.some(banned => {
    if (banned.length < 3) return false; 
    return spacelessText.includes(banned) || reversedSpaceless.includes(banned);
  });
};
