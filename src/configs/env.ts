import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
    PORT: string | number;
    

}

const envConfig = () : EnvConfig => {

    return {
        PORT: process.env.PORT || '3000',
    };

}

const env = envConfig();

export default env;