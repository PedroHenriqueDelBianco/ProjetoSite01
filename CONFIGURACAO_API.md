# Configuração de APIs e Segurança

Este documento explica como configurar as APIs e sistemas de segurança implementados no site.

## 📋 Índice

1. [reCAPTCHA](#recaptcha)
2. [EmailJS](#emailjs)
3. [Formspree](#formspree)
4. [Backend Customizado](#backend-customizado)
5. [Configurações de Segurança](#configurações-de-segurança)

---

## 🔒 reCAPTCHA

O site utiliza **reCAPTCHA v3** para proteção contra spam e bots.

### Como Configurar:

1. Acesse [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Clique em "+" para criar um novo site
3. Escolha **reCAPTCHA v3**
4. Adicione seu domínio (ex: `seusite.com` ou `localhost` para testes)
5. Copie a **Site Key** gerada
6. Abra o arquivo `js/api.js`
7. Substitua `YOUR_RECAPTCHA_SITE_KEY` pela sua chave:

```javascript
RECAPTCHA: {
    SITE_KEY: 'SUA_CHAVE_AQUI',
    VERSION: 3
}
```

**Nota:** Para produção, você também precisará configurar a **Secret Key** no backend para validação do token.

---

## 📧 EmailJS

EmailJS permite enviar emails diretamente do frontend sem necessidade de backend.

### Como Configurar:

1. Acesse [EmailJS](https://www.emailjs.com/)
2. Crie uma conta gratuita
3. Vá em **Email Services** e adicione um serviço (Gmail, Outlook, etc.)
4. Vá em **Email Templates** e crie um template com as variáveis:
   - `{{from_name}}`
   - `{{from_email}}`
   - `{{phone}}`
   - `{{message}}`
5. Vá em **Account** > **General** e copie sua **Public Key**
6. Abra o arquivo `js/api.js`
7. Configure as credenciais:

```javascript
EMAILJS: {
    SERVICE_ID: 'seu_service_id',
    TEMPLATE_ID: 'seu_template_id',
    PUBLIC_KEY: 'sua_public_key'
}
```

8. Altere o serviço padrão em `APIConfig.SERVICE`:

```javascript
SERVICE: 'emailjs',
```

---

## 📨 Formspree

Formspree é uma alternativa ao EmailJS, também sem necessidade de backend.

### Como Configurar:

1. Acesse [Formspree](https://formspree.io/)
2. Crie uma conta gratuita
3. Crie um novo formulário
4. Copie o **Form ID** (ex: `https://formspree.io/f/YOUR_FORM_ID`)
5. Abra o arquivo `js/api.js`
6. Configure:

```javascript
FORMSPREE: {
    ENDPOINT: 'https://formspree.io/f/SEU_FORM_ID'
}
```

8. Altere o serviço padrão:

```javascript
SERVICE: 'formspree',
```

---

## 🖥️ Backend Customizado

Se você tem seu próprio backend, pode configurá-lo aqui.

### Como Configurar:

1. Abra o arquivo `js/api.js`
2. Configure o endpoint:

```javascript
CUSTOM: {
    ENDPOINT: '/api/contact',  // ou URL completa: 'https://api.seudominio.com/contact'
    METHOD: 'POST',
    HEADERS: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SEU_TOKEN'  // opcional
    }
}
```

3. Altere o serviço padrão:

```javascript
SERVICE: 'custom',
```

### Exemplo de Endpoint Backend (Node.js/Express):

```javascript
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message, recaptcha_token, csrf_token } = req.body;
    
    // Validar reCAPTCHA
    const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=SUA_SECRET_KEY&response=${recaptcha_token}`
    });
    
    const recaptchaData = await recaptchaResponse.json();
    if (!recaptchaData.success) {
        return res.status(400).json({ error: 'reCAPTCHA inválido' });
    }
    
    // Processar e enviar email
    // ...
    
    res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
});
```

---

## 🛡️ Configurações de Segurança

### Rate Limiting

O sistema possui rate limiting configurável. Para ajustar, edite `js/security.js`:

```javascript
const SecurityConfig = {
    MAX_SUBMISSIONS_PER_HOUR: 5,    // Máximo de envios por hora
    MAX_SUBMISSIONS_PER_DAY: 20,    // Máximo de envios por dia
    BLOCK_DURATION: 60,              // Tempo de bloqueio em minutos
    // ...
};
```

### Content Security Policy (CSP)

Os headers CSP estão configurados nos arquivos HTML. Se precisar adicionar novos domínios, edite a meta tag:

```html
<meta http-equiv="Content-Security-Policy" content="...">
```

### Proteção CSRF

O sistema gera tokens CSRF automaticamente. Se usar backend customizado, valide o token:

```javascript
// No backend
if (req.body.csrf_token !== session.csrf_token) {
    return res.status(403).json({ error: 'Token CSRF inválido' });
}
```

---

## ✅ Checklist de Configuração

- [ ] Configurar reCAPTCHA v3
- [ ] Escolher e configurar serviço de email (EmailJS ou Formspree)
- [ ] Testar envio de formulário
- [ ] Verificar rate limiting funcionando
- [ ] Testar validações de segurança
- [ ] Configurar HTTPS em produção
- [ ] Revisar Content Security Policy

---

## 🚀 Testando

1. Abra o site no navegador
2. Vá para a página de contato
3. Preencha o formulário
4. Verifique se o reCAPTCHA está carregando (verifique o console do navegador)
5. Envie o formulário
6. Verifique se o email foi recebido

### Debug

Abra o Console do navegador (F12) para ver mensagens de erro ou logs de debug.

---

## 📞 Suporte

Em caso de dúvidas sobre a configuração, consulte:
- [Documentação EmailJS](https://www.emailjs.com/docs/)
- [Documentação Formspree](https://formspree.io/docs)
- [Documentação reCAPTCHA](https://developers.google.com/recaptcha/docs/v3)

---

**Importante:** Nunca exponha chaves secretas no código frontend. Use variáveis de ambiente ou configure no backend.
