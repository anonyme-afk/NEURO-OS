import { Request, Response, NextFunction } from 'express';
import { auditLog } from '../core/security';
import rateLimit from 'express-rate-limit';
import xss from 'xss';

export const rateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    handler: (req, res, next, options) => {
        auditLog('RATE_LIMIT_EXCEEDED (Brute-Force / DoS suspicious)', req.ip || 'unknown', { path: req.path });
        res.status(options.statusCode).json({ error: 'Trop de requêtes. IP bloquée temporairement (Anti Brute-Force actif).' });
    }
});

export function strictValidation(req: Request, res: Response, next: NextFunction) {
    const payload = JSON.stringify(req.body || {});
    
    // Advanced XSS filtering using the xss package
    const cleanPayload = xss(payload);
    if (payload !== cleanPayload) {
        auditLog('PAYLOAD_REJECTED (XSS Injection)', req.ip || 'unknown', { reason: 'XSS malicious pattern detected' });
        return res.status(403).json({ error: "PAYLOAD REJETÉ. Tentative d'injection XSS bloquée." });
    }
    
    next();
}
