import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
    PORT: string | number;
    TURNSTILE_SECRET_KEY: string;
}

const envConfig = () : EnvConfig => {

    return {
        PORT: process.env.PORT || '3000',
        TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA',
    };

}

const env = envConfig();

export default env;
