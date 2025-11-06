// Мобильное меню
document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    const body = document.body;

    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', function (e) {
            e.stopPropagation(); // Останавливаем всплытие события
            // Переключаем активное состояние
            hamburger.classList.toggle('active');
            mobileNav.classList.toggle('active');

            // Блокируем прокрутку body когда меню открыто
            if (mobileNav.classList.contains('active')) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        });

        // Закрываем меню при клике на ссылку
        const mobileLinks = mobileNav.querySelectorAll('.nav-link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                mobileNav.classList.remove('active');
                body.style.overflow = '';
            });
        });

        // Закрываем меню при клике вне области
        document.addEventListener('click', function (event) {
            const isClickInsideHeader = event.target.closest('.header');
            const isClickOnHamburger = event.target.closest('.hamburger');

            if (!isClickInsideHeader && mobileNav.classList.contains('active')) {
                hamburger.classList.remove('active');
                mobileNav.classList.remove('active');
                body.style.overflow = '';
            }
        });

        // Закрываем меню при изменении размера окна
        window.addEventListener('resize', function () {
            if (window.innerWidth > 768) {
                hamburger.classList.remove('active');
                mobileNav.classList.remove('active');
                body.style.overflow = '';
            }
        });
    }

    // Обработка формы регистрации
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                alert('Пароли не совпадают!');
                return;
            }

            // Здесь будет отправка формы на сервер
            alert('Регистрация успешно завершена!');
            window.location.href = 'instructions.html';
        });
    }
});