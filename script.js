// Scroll Suave para Seções
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar scroll suave para todos os links de navegação
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Calcular offset para compensar o header fixo
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight - 20;
                
                // Scroll suave
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Fechar menu mobile se estiver aberto
                const nav = document.querySelector('nav ul');
                if (window.innerWidth <= 768 && nav.classList.contains('active')) {
                    nav.classList.remove('active');
                }
            }
        });
    });
});

// Menu Mobile Toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav ul');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }
});

// Validação do Formulário de Contato com Segurança Avançada
let formValidator = null;
let formAPI = null;

// Inicializar validador e API quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    // Inicializar validador seguro
    if (typeof SecureFormValidator !== 'undefined') {
        formValidator = new SecureFormValidator('contactForm');
    }

    // Inicializar API de envio
    if (typeof initFormAPI !== 'undefined') {
        formAPI = initFormAPI();
    }

    // Validação em tempo real
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (formValidator) {
                formValidator.clearErrors();
                formValidator.validate();
                formValidator.displayErrors();
            }
        });

        input.addEventListener('input', function() {
            const group = this.closest('.form-group');
            if (group.classList.contains('error') && this.value.trim() !== '') {
                if (formValidator) {
                    formValidator.clearErrors();
                    formValidator.validate();
                    formValidator.displayErrors();
                }
            }
        });
    });

    // Submissão do formulário com segurança
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Limpar erros anteriores
        if (formValidator) {
            formValidator.clearErrors();
        }

        // Validar formulário
        let isValid = true;
        if (formValidator) {
            isValid = formValidator.validate();
            if (!isValid) {
                formValidator.displayErrors();
                const firstError = form.querySelector('.form-group.error, .general-error-message');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                return;
            }
        }

        const submitBtn = form.querySelector('.btn-submit');
        const successMessage = document.querySelector('.success-message');
        
        // Desabilitar botão durante envio
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            // Obter dados sanitizados
            let formData = null;
            if (formValidator) {
                formData = formValidator.getSanitizedData();
            } else {
                // Fallback para validação básica
                formData = {
                    name: document.getElementById('name').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    phone: document.getElementById('phone').value.trim(),
                    message: document.getElementById('message').value.trim()
                };
            }

            // Enviar via API
            if (formAPI) {
                const result = await formAPI.submitForm(formData);
                
                // Sucesso
                if (successMessage) {
                    successMessage.classList.add('show');
                    successMessage.innerHTML = `<strong>✓ ${result.message}</strong> Entraremos em contato em breve.`;
                }
                
                form.reset();
                
                // Remover classes de sucesso
                form.querySelectorAll('.form-group').forEach(group => {
                    group.classList.remove('success', 'error');
                });

                // Ocultar mensagem de sucesso após 5 segundos
                setTimeout(() => {
                    if (successMessage) {
                        successMessage.classList.remove('show');
                    }
                }, 5000);

                // Scroll para a mensagem de sucesso
                if (successMessage) {
                    successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            } else {
                throw new Error('API de envio não disponível');
            }
        } catch (error) {
            console.error('Erro ao enviar formulário:', error);
            
            // Exibir erro
            if (formValidator) {
                formValidator.showGeneralError(error.message || 'Erro ao enviar mensagem. Tente novamente mais tarde.');
            } else {
                alert(error.message || 'Erro ao enviar mensagem. Tente novamente mais tarde.');
            }
        } finally {
            // Reabilitar botão
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar Mensagem';
        }
    });
});

// FAQ Accordion
document.addEventListener('DOMContentLoaded', function() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Fechar todos os outros itens
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle do item atual
            item.classList.toggle('active', !isActive);
        });
    });
});

// Header scroll effect
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
});

// Adicionar classe js ao body para indicar que JavaScript está ativo
document.documentElement.classList.add('js');

// Scroll animations
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observar todas as seções
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        observer.observe(section);
    });
    
    // Observar cards de depoimentos e serviços
    const cards = document.querySelectorAll('.depoimento-card, .servico-card');
    const cardObserver = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                cardObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        cardObserver.observe(card);
    });
});

// não tenho ideia de como esse codigo ta funcionando, mas ele ta funcionando e boa 