/**
 * Environment Validator
 * 
 * Validates required and optional environment variables on app startup.
 * Helps catch configuration errors early before the app crashes.
 */

import { logger } from './logger';

interface EnvVariable {
    name: string;
    required: boolean;
    description: string;
    validator?: (value: string) => boolean;
    default?: string;
}

const isProduction = process.env.NODE_ENV === 'production';

// Define all environment variables with their requirements
const ENV_VARIABLES: EnvVariable[] = [
    // Required in production
    {
        name: 'DATABASE_URL',
        required: true,
        description: 'PostgreSQL connection string',
        validator: (v) => v.startsWith('postgres://') || v.startsWith('postgresql://'),
    },
    {
        name: 'SESSION_SECRET',
        required: isProduction,
        description: 'Secret key for session encryption (required in production)',
        validator: (v) => v.length >= 32,
    },

    // Optional but recommended
    {
        name: 'NODE_ENV',
        required: false,
        description: 'Environment mode (development, production, test)',
        default: 'development',
        validator: (v) => ['development', 'production', 'test'].includes(v),
    },
    {
        name: 'PORT',
        required: false,
        description: 'Server port number',
        default: '5001',
        validator: (v) => !Number.isNaN(Number.parseInt(v, 10)) && Number.parseInt(v, 10) > 0 && Number.parseInt(v, 10) < 65536,
    },
    {
        name: 'ALLOWED_ORIGINS',
        required: false,
        description: 'Comma-separated list of allowed CORS origins',
    },
    {
        name: 'SESSION_COOKIE_MAX_AGE',
        required: false,
        description: 'Session cookie max age in milliseconds',
        default: '2592000000', // 30 days
        validator: (v) => !Number.isNaN(Number.parseInt(v, 10)) && Number.parseInt(v, 10) > 0,
    },

    // Optional integrations
    {
        name: 'OPENAI_API_KEY',
        required: false,
        description: 'OpenAI API key for AI features',
        validator: (v) => v.startsWith('sk-'),
    },
    {
        name: 'SENDGRID_API_KEY',
        required: false,
        description: 'SendGrid API key for email notifications',
    },
    {
        name: 'FIREBASE_PROJECT_ID',
        required: false,
        description: 'Firebase project ID for push notifications',
    },
];

interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    summary: {
        total: number;
        required: number;
        optional: number;
        missing: number;
        invalid: number;
    };
}

/**
 * Validates all environment variables and returns a report
 */
export function validateEnvironment(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let missingCount = 0;
    let invalidCount = 0;

    for (const envVar of ENV_VARIABLES) {
        const value = process.env[envVar.name];

        // Check if required variable is missing
        if (!value) {
            if (envVar.required) {
                errors.push(`Missing required: ${envVar.name} - ${envVar.description}`);
                missingCount++;
            } else if (envVar.default) {
                // Apply default value
                process.env[envVar.name] = envVar.default;
            } else {
                warnings.push(`Missing optional: ${envVar.name} - ${envVar.description}`);
            }
            continue;
        }

        // Validate value if validator exists
        if (envVar.validator && !envVar.validator(value)) {
            if (envVar.required) {
                errors.push(`Invalid value for ${envVar.name}: Failed validation - ${envVar.description}`);
                invalidCount++;
            } else {
                warnings.push(`Invalid value for ${envVar.name}: Using anyway - ${envVar.description}`);
            }
        }
    }

    const requiredCount = ENV_VARIABLES.filter(v => v.required).length;
    const optionalCount = ENV_VARIABLES.length - requiredCount;

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        summary: {
            total: ENV_VARIABLES.length,
            required: requiredCount,
            optional: optionalCount,
            missing: missingCount,
            invalid: invalidCount,
        },
    };
}

/**
 * Validates environment and logs results.
 * In production, exits if critical variables are missing.
 * In development, only warns.
 */
export function validateAndLogEnvironment(): boolean {
    const result = validateEnvironment();

    logger.info('Environment Validation Results:');
    logger.info(`  Total variables: ${result.summary.total}`);
    logger.info(`  Required: ${result.summary.required}, Optional: ${result.summary.optional}`);

    if (result.errors.length > 0) {
        logger.error('Environment Validation Errors:');
        result.errors.forEach(err => logger.error(`  ❌ ${err}`));
    }

    if (result.warnings.length > 0) {
        result.warnings.forEach(warn => logger.warn(`  ⚠️  ${warn}`));
    }

    if (result.valid) {
        logger.info('✅ Environment validation passed');
    } else {
        logger.error('❌ Environment validation failed');

        if (isProduction) {
            logger.error('Cannot start in production with missing required environment variables.');
            logger.error('Please set the required variables and restart the server.');
            return false;
        } else {
            logger.warn('Continuing in development mode despite missing variables...');
        }
    }

    return result.valid;
}

/**
 * Get a summary of environment configuration (safe for logging)
 */
export function getEnvironmentSummary(): Record<string, string> {
    const summary: Record<string, string> = {};

    for (const envVar of ENV_VARIABLES) {
        const value = process.env[envVar.name];

        if (!value) {
            summary[envVar.name] = '[not set]';
        } else if (envVar.name.includes('SECRET') || envVar.name.includes('KEY') || envVar.name.includes('PASSWORD')) {
            // Mask sensitive values
            summary[envVar.name] = `[set, ${value.length} chars]`;
        } else if (envVar.name === 'DATABASE_URL') {
            // Mask database URL credentials
            try {
                const url = new URL(value);
                summary[envVar.name] = `${url.protocol}//*****@${url.host}${url.pathname}`;
            } catch {
                summary[envVar.name] = '[set, invalid URL]';
            }
        } else {
            summary[envVar.name] = value;
        }
    }

    return summary;
}

export default {
    validateEnvironment,
    validateAndLogEnvironment,
    getEnvironmentSummary,
};

