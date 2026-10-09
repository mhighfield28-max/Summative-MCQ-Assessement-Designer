// Everything you might want to change without touching the rest of the code.

export const APP_NAME = 'Questions That Count';
export const APP_TAGLINE = 'Bloom-aligned MCQ generator';
export const BRAND_URL = 'https://mikehighfield.ai';
export const BRAND_NAME = 'mikehighfield.ai';

// The Claude model used for every generation call. Change it here only.
export const MODEL = 'claude-sonnet-4-6';
export const MAX_TOKENS_PER_BATCH = 8000;

// Questions are written in small batches so progress shows question by question.
export const BATCH_SIZE = 5;

// Part A lives in this file and is loaded at start-up. Edit the file to change the rules.
export const HOUSE_RULES_URL = `${process.env.PUBLIC_URL || ''}/spec/part-a-house-rules.md`;

export const MAX_UPLOAD_FILES = 20;
