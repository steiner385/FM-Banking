import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const auth = {
  generateToken: async (payload: TokenPayload): Promise<string> => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  },

  verifyToken: async (token: string): Promise<TokenPayload> => {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
};

export const { generateToken, verifyToken } = auth;
