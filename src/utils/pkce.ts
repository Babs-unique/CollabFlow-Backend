import crypto from 'crypto'; 

export function generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('hex');
}


const base64urlEncode = (str: Buffer): string => {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export function generateCodeChallenge(codeVerifier: string): string {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    return base64urlEncode(hash);
}