import * as fs from 'fs';
import * as path from 'path';

export class TokenManager {
    private static readonly AUTH_FILE = path.join(process.cwd(), 'auth.json');

    /**
     * Extracts the JWT token from auth.json storage state.
     * Conduit usually stores the token in localStorage under the key 'jwtToken' or 'token'.
     * We'll check for common keys.
     */
    static getToken(): string | null {
        try {
            if (!fs.existsSync(this.AUTH_FILE)) {
                return null;
            }

            const authState = JSON.parse(fs.readFileSync(this.AUTH_FILE, 'utf-8'));
            
            // Search in localStorage
            for (const origin of authState.origins || []) {
                for (const item of origin.localStorage || []) {
                    if (['jwtToken', 'token', 'jwt'].includes(item.name)) {
                        return item.value;
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to read token from auth.json:', error);
        }
        return null;
    }
}
