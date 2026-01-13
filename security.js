/**
 * Sistema de Segurança para o Site
 * Inclui sanitização, validação avançada e proteção contra ataques comuns
 */

// Configurações de segurança
const SecurityConfig = {
    // Rate limiting - máximo de tentativas por IP
    MAX_SUBMISSIONS_PER_HOUR: 5,
    MAX_SUBMISSIONS_PER_DAY: 20,
    
    // Tempo de bloqueio após muitas tentativas (em minutos)
    BLOCK_DURATION: 60,
    
    // Tamanhos máximos
    MAX_NAME_LENGTH: 100,
    MAX_EMAIL_LENGTH: 255,
    MAX_PHONE_LENGTH: 20,
    MAX_MESSAGE_LENGTH: 2000,
    
    // Padrões de validação
    PATTERNS: {
        EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        PHONE_BR: /^(\+55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}[-.\s]?\d{4})$/,
        NAME: /^[a-zA-ZÀ-ÿ\s]{3,}$/,
        XSS: /<script|javascript:|onerror=|onclick=|onload=|onmouseover=|onfocus=|onblur=/i
    }
};

/**
 * Rate Limiting usando localStorage
 */
class RateLimiter {
    constructor() {
        this.storageKey = 'form_submissions';
        this.blockedKey = 'blocked_until';
    }

    /**
     * Verifica se o usuário pode enviar formulário
     */
    canSubmit() {
        const blockedUntil = localStorage.getItem(this.blockedKey);
        
        if (blockedUntil && Date.now() < parseInt(blockedUntil)) {
            const minutesLeft = Math.ceil((parseInt(blockedUntil) - Date.now()) / 60000);
            return {
                allowed: false,
                message: `Muitas tentativas. Tente novamente em ${minutesLeft} minuto(s).`
            };
        }

        const submissions = this.getSubmissions();
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        const oneDayAgo = now - 86400000;

        // Contar submissões na última hora
        const recentHour = submissions.filter(time => time > oneHourAgo).length;
        if (recentHour >= SecurityConfig.MAX_SUBMISSIONS_PER_HOUR) {
            this.blockUser(SecurityConfig.BLOCK_DURATION);
            return {
                allowed: false,
                message: 'Muitas tentativas na última hora. Tente novamente mais tarde.'
            };
        }

        // Contar submissões nas últimas 24 horas
        const recentDay = submissions.filter(time => time > oneDayAgo).length;
        if (recentDay >= SecurityConfig.MAX_SUBMISSIONS_PER_DAY) {
            this.blockUser(SecurityConfig.BLOCK_DURATION * 2);
            return {
                allowed: false,
                message: 'Limite diário de envios atingido. Tente novamente amanhã.'
            };
        }

        return { allowed: true };
    }

    /**
     * Registra uma submissão bem-sucedida
     */
    recordSubmission() {
        const submissions = this.getSubmissions();
        submissions.push(Date.now());
        
        // Manter apenas as últimas 24 horas
        const oneDayAgo = Date.now() - 86400000;
        const filtered = submissions.filter(time => time > oneDayAgo);
        
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }

    /**
     * Bloqueia o usuário temporariamente
     */
    blockUser(minutes) {
        const blockedUntil = Date.now() + (minutes * 60000);
        localStorage.setItem(this.blockedKey, blockedUntil.toString());
    }

    /**
     * Obtém histórico de submissões
     */
    getSubmissions() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Limpa o histórico (útil para testes)
     */
    clearHistory() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.blockedKey);
    }
}

/**
 * Sanitização de inputs
 */
class InputSanitizer {
    /**
     * Remove tags HTML e caracteres perigosos
     */
    static sanitize(text) {
        if (typeof text !== 'string') return '';
        
        // Remover tags HTML
        let sanitized = text.replace(/<[^>]*>/g, '');
        
        // Escapar caracteres especiais
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
        
        // Remover caracteres de controle
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
        
        return sanitized.trim();
    }

    /**
     * Sanitiza mantendo quebras de linha
     */
    static sanitizeMultiline(text) {
        if (typeof text !== 'string') return '';
        
        // Primeiro sanitizar normalmente
        let sanitized = this.sanitize(text);
        
        // Restaurar quebras de linha seguras
        sanitized = sanitized.replace(/\n/g, '<br>');
        
        return sanitized;
    }

    /**
     * Valida e sanitiza email
     */
    static sanitizeEmail(email) {
        if (typeof email !== 'string') return '';
        
        const sanitized = email.trim().toLowerCase();
        
        if (!SecurityConfig.PATTERNS.EMAIL.test(sanitized)) {
            return null;
        }
        
        // Verificar tamanho máximo
        if (sanitized.length > SecurityConfig.MAX_EMAIL_LENGTH) {
            return null;
        }
        
        return sanitized;
    }

    /**
     * Valida e sanitiza telefone brasileiro
     */
    static sanitizePhone(phone) {
        if (typeof phone !== 'string') return '';
        
        // Remover caracteres não numéricos exceto +, espaços, parênteses e hífens
        let sanitized = phone.replace(/[^\d\s\(\)\-\+]/g, '');
        
        // Verificar padrão brasileiro
        if (!SecurityConfig.PATTERNS.PHONE_BR.test(sanitized)) {
            return null;
        }
        
        // Verificar tamanho máximo
        if (sanitized.length > SecurityConfig.MAX_PHONE_LENGTH) {
            return null;
        }
        
        return sanitized.trim();
    }

    /**
     * Valida e sanitiza nome
     */
    static sanitizeName(name) {
        if (typeof name !== 'string') return '';
        
        const sanitized = name.trim();
        
        // Verificar padrão de nome (apenas letras, espaços e acentos)
        if (!SecurityConfig.PATTERNS.NAME.test(sanitized)) {
            return null;
        }
        
        // Verificar tamanho
        if (sanitized.length < 3 || sanitized.length > SecurityConfig.MAX_NAME_LENGTH) {
            return null;
        }
        
        // Verificar XSS
        if (SecurityConfig.PATTERNS.XSS.test(sanitized)) {
            return null;
        }
        
        return sanitized;
    }

    /**
     * Valida e sanitiza mensagem
     */
    static sanitizeMessage(message) {
        if (typeof message !== 'string') return '';
        
        const sanitized = message.trim();
        
        // Verificar tamanho mínimo e máximo
        if (sanitized.length < 10 || sanitized.length > SecurityConfig.MAX_MESSAGE_LENGTH) {
            return null;
        }
        
        // Verificar XSS
        if (SecurityConfig.PATTERNS.XSS.test(sanitized)) {
            return null;
        }
        
        // Sanitizar mas manter estrutura básica
        return this.sanitize(sanitized);
    }
}

/**
 * Validador de formulário com segurança avançada
 */
class SecureFormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.rateLimiter = new RateLimiter();
        this.errors = {};
    }

    /**
     * Valida todos os campos do formulário
     */
    validate() {
        if (!this.form) return false;
        
        this.errors = {};
        let isValid = true;

        // Validar nome
        const nameInput = this.form.querySelector('#name');
        if (nameInput) {
            const name = InputSanitizer.sanitizeName(nameInput.value);
            if (!name) {
                this.errors.name = 'Nome inválido. Use apenas letras e espaços (mínimo 3 caracteres).';
                isValid = false;
            }
        }

        // Validar email
        const emailInput = this.form.querySelector('#email');
        if (emailInput) {
            const email = InputSanitizer.sanitizeEmail(emailInput.value);
            if (!email) {
                this.errors.email = 'Email inválido. Por favor, insira um email válido.';
                isValid = false;
            }
        }

        // Validar telefone
        const phoneInput = this.form.querySelector('#phone');
        if (phoneInput) {
            const phone = InputSanitizer.sanitizePhone(phoneInput.value);
            if (!phone) {
                this.errors.phone = 'Telefone inválido. Use o formato brasileiro: (11) 99999-9999';
                isValid = false;
            }
        }

        // Validar mensagem
        const messageInput = this.form.querySelector('#message');
        if (messageInput) {
            const message = InputSanitizer.sanitizeMessage(messageInput.value);
            if (!message) {
                this.errors.message = 'Mensagem inválida. Deve ter entre 10 e 2000 caracteres.';
                isValid = false;
            }
        }

        // Verificar rate limiting
        const rateLimitCheck = this.rateLimiter.canSubmit();
        if (!rateLimitCheck.allowed) {
            this.errors.rateLimit = rateLimitCheck.message;
            isValid = false;
        }

        return isValid;
    }

    /**
     * Obtém dados sanitizados do formulário
     */
    getSanitizedData() {
        if (!this.form) return null;
        
        return {
            name: InputSanitizer.sanitizeName(this.form.querySelector('#name')?.value || ''),
            email: InputSanitizer.sanitizeEmail(this.form.querySelector('#email')?.value || ''),
            phone: InputSanitizer.sanitizePhone(this.form.querySelector('#phone')?.value || ''),
            message: InputSanitizer.sanitizeMessage(this.form.querySelector('#message')?.value || ''),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
        };
    }

    /**
     * Exibe erros no formulário
     */
    displayErrors() {
        Object.keys(this.errors).forEach(field => {
            if (field === 'rateLimit') {
                // Exibir erro geral
                this.showGeneralError(this.errors[field]);
            } else {
                const input = this.form.querySelector(`#${field}`);
                if (input) {
                    const group = input.closest('.form-group');
                    if (group) {
                        group.classList.add('error');
                        const errorSpan = group.querySelector('.error-message');
                        if (errorSpan) {
                            errorSpan.textContent = this.errors[field];
                        }
                    }
                }
            }
        });
    }

    /**
     * Exibe erro geral
     */
    showGeneralError(message) {
        // Criar ou atualizar mensagem de erro geral
        let errorDiv = document.querySelector('.general-error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'general-error-message';
            this.form.insertBefore(errorDiv, this.form.firstChild);
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Limpa erros do formulário
     */
    clearErrors() {
        this.errors = {};
        if (this.form) {
            this.form.querySelectorAll('.form-group').forEach(group => {
                group.classList.remove('error');
            });
            const errorDiv = document.querySelector('.general-error-message');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }
    }
}

/**
 * Proteção CSRF simples usando tokens
 */
class CSRFProtection {
    constructor() {
        this.tokenKey = 'csrf_token';
        this.tokenExpiry = 3600000; // 1 hora
    }

    /**
     * Gera um token CSRF
     */
    generateToken() {
        const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        const tokenData = {
            token: token,
            expiry: Date.now() + this.tokenExpiry
        };
        
        sessionStorage.setItem(this.tokenKey, JSON.stringify(tokenData));
        return token;
    }

    /**
     * Obtém token CSRF válido
     */
    getToken() {
        try {
            const stored = sessionStorage.getItem(this.tokenKey);
            if (!stored) return this.generateToken();
            
            const tokenData = JSON.parse(stored);
            
            // Verificar se expirou
            if (Date.now() > tokenData.expiry) {
                return this.generateToken();
            }
            
            return tokenData.token;
        } catch (e) {
            return this.generateToken();
        }
    }

    /**
     * Valida token CSRF
     */
    validateToken(token) {
        const storedToken = this.getToken();
        return storedToken === token;
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.SecurityConfig = SecurityConfig;
    window.RateLimiter = RateLimiter;
    window.InputSanitizer = InputSanitizer;
    window.SecureFormValidator = SecureFormValidator;
    window.CSRFProtection = CSRFProtection;
}
