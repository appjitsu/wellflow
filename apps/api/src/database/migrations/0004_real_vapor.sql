-- Add uppercase enum values to well_type
ALTER TYPE "well_type" ADD VALUE 'OIL';
ALTER TYPE "well_type" ADD VALUE 'GAS';
ALTER TYPE "well_type" ADD VALUE 'OIL_AND_GAS';
ALTER TYPE "well_type" ADD VALUE 'WATER';
ALTER TYPE "well_type" ADD VALUE 'OTHER';

-- Add uppercase enum values to well_status
ALTER TYPE "well_status" ADD VALUE 'PLANNED';
ALTER TYPE "well_status" ADD VALUE 'PERMITTED';
ALTER TYPE "well_status" ADD VALUE 'DRILLING';
ALTER TYPE "well_status" ADD VALUE 'COMPLETED';
ALTER TYPE "well_status" ADD VALUE 'PRODUCING';
ALTER TYPE "well_status" ADD VALUE 'SHUT_IN';
ALTER TYPE "well_status" ADD VALUE 'TEMPORARILY_ABANDONED';
ALTER TYPE "well_status" ADD VALUE 'PERMANENTLY_ABANDONED';
ALTER TYPE "well_status" ADD VALUE 'UNKNOWN';
ALTER TYPE "well_status" ADD VALUE 'ACTIVE';
ALTER TYPE "well_status" ADD VALUE 'INACTIVE';