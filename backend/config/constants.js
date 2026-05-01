/**
 * config/constants.js — Single source of truth for business rules.
 * All controllers and services MUST import from here.
 * DO NOT hardcode these values elsewhere.
 */

const MAX_SEATS_PER_ORDER = parseInt(process.env.MAX_SEATS_PER_ORDER) || 10;
const SEAT_LOCK_TIMEOUT_MINUTES = parseInt(process.env.SEAT_LOCK_TIMEOUT_MINUTES) || 10;
const SEAT_LOCK_TIMEOUT_MS = SEAT_LOCK_TIMEOUT_MINUTES * 60 * 1000;

module.exports = { MAX_SEATS_PER_ORDER, SEAT_LOCK_TIMEOUT_MINUTES, SEAT_LOCK_TIMEOUT_MS };
