import { supabase } from './supabase.js';
import natural from 'natural';

const stemmer = natural.PorterStemmer;
let bannedWordsCache = [];
let lastFetched = 0;

const getBannedWords = async () => {
  const now = Date.now();
  if (bannedWordsCache.length > 0 && now - lastFetched < 300000) {
    return bannedWordsCache;
  }

  const { data } = await supabase.from('prohibited_words').select('word');
  bannedWordsCache = data?.map(row => row.word.toLowerCase()) || [];
  lastFetched = now;
  return bannedWordsCache;
};

/**
 * Normalizes text to catch bypasses:
 * 1. Removes accents/diacritics (á -> a)
 * 2. Replaces leetspeak numbers with letters (8 -> b)
 * 3. Removes special characters
 * 4. Collapses repeated letters
 */
const normalizeText = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    // 1. Remove Accents/Diacritics (Acute, Grave, Circumflex, etc.)
    // This handles: á, é, í, ó, ú, ý, à, è, ì, ò, ù, â, ê, î, ô, û, ä, ë, ï, ö, ü, ÿ, ñ, ã, õ
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    
    // 2. Handle specific ligatures/others manually
    .replace(/ç/g, 'c')
    .replace(/ø/g, 'o')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/å/g, 'a')

    // 3. Handle Leetspeak/Number substitutions
    .replace(/[04@]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/[7+]/g, 't')
    .replace(/8/g, 'b')  // Fixes '8080' -> 'bobo'
    .replace(/6/g, 'g')
    .replace(/9/g, 'g')
    .replace(/v/g, 'u')  // Slang bypass (sangina)

    // 4. Remove all remaining non-alphabetic characters
    .replace(/[^a-z\s]/g, '')
    
    // 5. Collapse repeated characters (e.g., 'tannngina' -> 'tangina')
    .replace(/(.)\1+/g, '$1');
};

export const isOffensive = async (text) => {
  if (!text) return false;
  
  const bannedWords = await getBannedWords();
  const cleanText = normalizeText(text);
  
  // Split into tokens for individual word checking
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(cleanText);

  // Check 1: Direct Token Match and Stemming
  const hasBannedToken = tokens.some(token => {
    const stemmed = stemmer.stem(token); 
    return bannedWords.includes(token) || bannedWords.includes(stemmed);
  });

  if (hasBannedToken) return true;

  // Check 2: Substring Match (The "Aggressive" Check)
  const spacelessText = cleanText.replace(/\s+/g, '');
  const hasHiddenWord = bannedWords.some(banned => {
    // We ignore very short banned words to prevent false positives in substrings
    if (banned.length < 3) return false; 
    return spacelessText.includes(banned);
  });

  return hasHiddenWord;
};
