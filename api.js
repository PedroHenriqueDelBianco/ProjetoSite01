/**
 * API de Envio de Formulário
 * Suporta múltiplos serviços: EmailJS, Formspree, e backend customizado
 */

// Configuração da API
const APIConfig = {
    // Escolha o serviço: 'emailjs', 'formspree', ou 'custom'
    SERVICE: 'emailjs',
    
    // Configuração EmailJS
    EMAILJS: {
        SERVICE_ID: 'YOUR_SERVICE_ID', // Substitua pelo seu Service ID
        TEMPLATE_ID: 'YOUR_TEMPLATE_ID', // Substitua pelo seu Template ID
        PUBLIC_KEY: 'YOUR_PUBLIC_KEY' // Substitua pela sua Public Key
    },
    
    // Configuração Formspree
    FORMSPREE: {
        ENDPOINT: 'https://formspree.io/f/YOUR_FORM_ID' // Substitua pelo seu Form ID
    },
    
    // Configuração Backend Customizado
    CUSTOM: {
        ENDPOINT: '/api/contact',
        METHOD: 'POST',
        HEADERS: {
            'Content-Type': 'application/json'
        }
    },
    
    // Configuração reCAPTCHA
    RECAPTCHA: {
        SITE_KEY: 'YOUR_RECAPTCHA_SITE_KEY', // Substitua pela sua chave do reCAPTCHA
        VERSION: 3 // Use 3 para reCAPTCHA v3 ou 2 para v2
    }
};

/**
 * Classe para gerenciar envio de formulários
 */
class FormSubmissionAPI {
    constructor() {
        this.csrfProtection = new CSRFProtection();
        this.rateLimiter = new RateLimiter();
        this.recaptchaLoaded = false;
    }

    /**
     * Carrega o script do reCAPTCHA
     */
    loadRecaptcha() {
        if (this.recaptchaLoaded) return Promise.resolve();
        
        return new Promise((resolve, reject) => {
            // Verificar se já está carregado
            if (window.grecaptcha) {
                this.recaptchaLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=${APIConfig.RECAPTCHA.SITE_KEY}`;
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                this.recaptchaLoaded = true;
                resolve();
            };
            
            script.onerror = () => {
                reject(new Error('Falha ao carregar reCAPTCHA'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Obtém token do reCAPTCHA v3
     */
    async getRecaptchaToken(action = 'submit') {
        try {
            await this.loadRecaptcha();
            
            if (!window.grecaptcha || !window.grecaptcha.ready) {
                throw new Error('reCAPTCHA não está disponível');
            }

            return new Promise((resolve, reject) => {
                window.grecaptcha.ready(() => {
                    window.grecaptcha.execute(APIConfig.RECAPTCHA.SITE_KEY, { action })
                        .then(token => resolve(token))
                        .catch(error => reject(error));
                });
            });
        } catch (error) {
            console.error('Erro ao obter token reCAPTCHA:', error);
            throw error;
        }
    }

    /**
     * Envia formulário usando EmailJS
     */
    async sendViaEmailJS(formData) {
        // Verificar se EmailJS está carregado
        if (!window.emailjs) {
            // Carregar EmailJS
            await this.loadEmailJS();
        }

        const templateParams = {
            from_name: formData.name,
            from_email: formData.email,
            phone: formData.phone,
            message: formData.message,
            reply_to: formData.email
        };

        try {
            const response = await window.emailjs.send(
                APIConfig.EMAILJS.SERVICE_ID,
                APIConfig.EMAILJS.TEMPLATE_ID,
                templateParams,
                APIConfig.EMAILJS.PUBLIC_KEY
            );

            return {
                success: true,
                message: 'Mensagem enviada com sucesso!',
                data: response
            };
        } catch (error) {
            console.error('Erro ao enviar via EmailJS:', error);
            throw new Error('Falha ao enviar mensagem. Tente novamente mais tarde.');
        }
    }

    /**
     * Carrega o script do EmailJS
     */
    loadEmailJS() {
        return new Promise((resolve, reject) => {
            if (window.emailjs) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
            script.async = true;
            
            script.onload = () => {
                window.emailjs.init(APIConfig.EMAILJS.PUBLIC_KEY);
                resolve();
            };
            
            script.onerror = () => {
                reject(new Error('Falha ao carregar EmailJS'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Envia formulário usando Formspree
     */
    async sendViaFormspree(formData) {
        const payload = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            message: formData.message,
            _subject: 'Nova mensagem do site - Centro de Terapia',
            _format: 'plain'
        };

        try {
            const response = await fetch(APIConfig.FORMSPREE.ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();

            return {
                success: true,
                message: 'Mensagem enviada com sucesso!',
                data: data
            };
        } catch (error) {
            console.error('Erro ao enviar via Formspree:', error);
            throw new Error('Falha ao enviar mensagem. Tente novamente mais tarde.');
        }
    }

    /**
     * Envia formulário para backend customizado
     */
    async sendViaCustom(formData) {
        const csrfToken = this.csrfProtection.getToken();
        
        const payload = {
            ...formData,
            csrf_token: csrfToken
        };

        try {
            const response = await fetch(APIConfig.CUSTOM.ENDPOINT, {
                method: APIConfig.CUSTOM.METHOD,
                headers: {
                    ...APIConfig.CUSTOM.HEADERS,
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();

            return {
                success: true,
                message: data.message || 'Mensagem enviada com sucesso!',
                data: data
            };
        } catch (error) {
            console.error('Erro ao enviar via backend customizado:', error);
            throw new Error('Falha ao enviar mensagem. Tente novamente mais tarde.');
        }
    }

    /**
     * Envia formulário (método principal)
     */
    async submitForm(formData) {
        try {
            // Verificar rate limiting
            const rateLimitCheck = this.rateLimiter.canSubmit();
            if (!rateLimitCheck.allowed) {
                throw new Error(rateLimitCheck.message);
            }

            // Obter token reCAPTCHA
            let recaptchaToken = null;
            try {
                recaptchaToken = await this.getRecaptchaToken('submit');
            } catch (error) {
                console.warn('reCAPTCHA não disponível, continuando sem validação:', error);
                // Continuar sem reCAPTCHA em desenvolvimento, mas em produção você pode querer bloquear
            }

            // Adicionar token reCAPTCHA aos dados
            const dataWithRecaptcha = {
                ...formData,
                recaptcha_token: recaptchaToken
            };

            // Enviar usando o serviço configurado
            let result;
            switch (APIConfig.SERVICE.toLowerCase()) {
                case 'emailjs':
                    result = await this.sendViaEmailJS(dataWithRecaptcha);
                    break;
                case 'formspree':
                    result = await this.sendViaFormspree(dataWithRecaptcha);
                    break;
                case 'custom':
                    result = await this.sendViaCustom(dataWithRecaptcha);
                    break;
                default:
                    throw new Error('Serviço de API não configurado corretamente');
            }

            // Registrar submissão bem-sucedida
            this.rateLimiter.recordSubmission();

            return result;
        } catch (error) {
            console.error('Erro ao enviar formulário:', error);
            throw error;
        }
    }
}

/**
 * Função auxiliar para inicializar API
 */
function initFormAPI() {
    if (!window.FormSubmissionAPI) {
        window.FormSubmissionAPI = FormSubmissionAPI;
    }
    return new FormSubmissionAPI();
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.APIConfig = APIConfig;
    window.FormSubmissionAPI = FormSubmissionAPI;
    window.initFormAPI = initFormAPI;
}
