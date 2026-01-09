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

// Validação do Formulário de Contato
function validateForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const message = document.getElementById('message');
    const submitBtn = document.querySelector('.btn-submit');
    const successMessage = document.querySelector('.success-message');

    let isValid = true;

    // Validação do nome
    const nameGroup = name.closest('.form-group');
    if (name.value.trim().length < 3) {
        nameGroup.classList.add('error');
        isValid = false;
    } else {
        nameGroup.classList.remove('error');
        nameGroup.classList.add('success');
    }

    // Validação do email
    const emailGroup = email.closest('.form-group');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        emailGroup.classList.add('error');
        isValid = false;
    } else {
        emailGroup.classList.remove('error');
        emailGroup.classList.add('success');
    }

    // Validação do telefone
    const phoneGroup = phone.closest('.form-group');
    const phoneRegex = /^[\d\s\(\)\-\+]+$/;
    if (phone.value.trim().length < 10 || !phoneRegex.test(phone.value)) {
        phoneGroup.classList.add('error');
        isValid = false;
    } else {
        phoneGroup.classList.remove('error');
        phoneGroup.classList.add('success');
    }

    // Validação da mensagem
    const messageGroup = message.closest('.form-group');
    if (message.value.trim().length < 10) {
        messageGroup.classList.add('error');
        isValid = false;
    } else {
        messageGroup.classList.remove('error');
        messageGroup.classList.add('success');
    }

    return isValid;
}

// Event listeners para validação em tempo real
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateForm();
        });

        input.addEventListener('input', function() {
            const group = this.closest('.form-group');
            if (group.classList.contains('error') && this.value.trim() !== '') {
                validateForm();
            }
        });
    });

    // Submissão do formulário
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            const submitBtn = form.querySelector('.btn-submit');
            const successMessage = document.querySelector('.success-message');
            
            // Desabilitar botão durante envio
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            // Simular envio (aqui você pode integrar com um backend real)
            setTimeout(() => {
                successMessage.classList.add('show');
                form.reset();
                
                // Remover classes de sucesso
                form.querySelectorAll('.form-group').forEach(group => {
                    group.classList.remove('success');
                });

                // Reabilitar botão
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Mensagem';

                // Ocultar mensagem de sucesso após 5 segundos
                setTimeout(() => {
                    successMessage.classList.remove('show');
                }, 5000);

                // Scroll para a mensagem de sucesso
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 1000);
        } else {
            // Scroll para o primeiro erro
            const firstError = form.querySelector('.form-group.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    });
});

// não tenho ideia de como esse codigo ta funcionando, mas ele ta funcionando e boa 