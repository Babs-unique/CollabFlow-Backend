import crypto from 'crypto';

interface StateData {
    [key: string]: unknown;
    createdAt: number;
    codeVerifier?: string;
}

const STATE_SECRET = process.env.OAUTH_STATE_SECRET || process.env.JWT_SECRET || 'dev-oauth-state-secret';
const STATE_TTL_MS = 15 * 60 * 1000;

const getEncryptionKey = () => {
    return crypto.createHash('sha256').update(STATE_SECRET).digest();
};

const encode = (value: Buffer) => value.toString('base64url');
const decode = (value: string) => Buffer.from(value, 'base64url');

export function generateState(pkceState: Partial<StateData>): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
    const payload = Buffer.from(JSON.stringify({
        ...pkceState,
        createdAt: Date.now(),
        nonce: crypto.randomBytes(16).toString('hex'),
    }));

    const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [encode(iv), encode(authTag), encode(encrypted)].join('.');
}

export function validateState(state: string): StateData | null {
    try {
        const [iv, authTag, encrypted] = state.split('.');
        if (!iv || !authTag || !encrypted) {
            return null;
        }

        const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), decode(iv));
        decipher.setAuthTag(decode(authTag));

        const decrypted = Buffer.concat([
            decipher.update(decode(encrypted)),
            decipher.final(),
        ]);

        const stateData = JSON.parse(decrypted.toString()) as StateData;
        if (!stateData.createdAt || Date.now() - stateData.createdAt > STATE_TTL_MS) {
            return null;
        }

        return stateData;
    } catch {
        return null;
    }
}

export function deleteState(state: string): void {
    void state;
}


/* import crypto from 'crypto';


interface StateData {
    [key: string]: any;
    createdAt: number;
    codeVerifier?: string;
}

const stateStore = new Map<string, StateData>();
export function generateState(pkceState: Partial<StateData>): string {
  const newState = crypto.randomBytes(16).toString('hex');
  stateStore.set(newState, 
    {
        ...pkceState,
        createdAt: Date.now()
    }
  );
  return newState;
}

export function validateState(state: string): any | null {
    return stateStore.get(state) || null;
}

export function deleteState(state: string): void {   
    stateStore.delete(state);
} */