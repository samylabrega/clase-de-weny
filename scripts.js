// Simplemente una función para animar el scroll al navegar
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Función para simular envío de formulario
document.getElementById('contact-form').addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Gracias por tu mensaje. Me pondré en contacto contigo pronto.');
});
