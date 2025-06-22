// Знаходимо кнопку гамбургера і навігаційне меню в документі
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const mainNav = document.getElementById('mainNav');

        // Додаємо обробник події "click" на кнопку
        hamburgerMenu.addEventListener('click', () => {
            // При кожному кліку додаємо/видаляємо клас 'active' у навігаційного меню
            // Це дозволить нам показувати або ховати меню за допомогою CSS
            mainNav.classList.toggle('active');

            // Також можна змінювати іконку з "бургер" на "хрестик"
            const icon = hamburgerMenu.querySelector('i');
            if (mainNav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
                hamburgerMenu.setAttribute('aria-label', 'Закрити меню');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
                hamburgerMenu.setAttribute('aria-label', 'Відкрити меню');
            }
        });
         // --- Логіка розрахунку вартості 3D-моделі ---
        const calculateBtn = document.getElementById('calculateBtn');
        const modelUploader = document.getElementById('modelUploader');
        const resultDiv = document.getElementById('calculationResult');

        const PRICE_PER_GRAM = 2; // Ціна за грам в гривнях
        const PLA_DENSITY_G_CM3 = 1.24; // Щільність PLA пластику в г/см³

        calculateBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Запобігаємо переходу за посиланням
            modelUploader.click(); // Відкриваємо вікно вибору файлу
        });

        modelUploader.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) {
                return;
            }

            // Показуємо блок з результатом та повідомлення про аналіз
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<p>Аналізую модель...</p>';

            const reader = new FileReader();
            const loader = new THREE.STLLoader();

            reader.onload = (e) => {
                try {
                    const geometry = loader.parse(e.target.result);
                    
                    // Моделі зазвичай створюються в мм, тому об'єм буде в мм³.
                    // Конвертуємо в см³ (1 см³ = 1000 мм³)
                    const volumeCm3 = calculateVolume(geometry) / 1000;
                    
                    if (volumeCm3 > 0) {
                        const weightGrams = volumeCm3 * PLA_DENSITY_G_CM3;
                        const priceUah = weightGrams * PRICE_PER_GRAM;

                        resultDiv.innerHTML = `
                            <p><strong>Орієнтовний розрахунок для PLA пластику:</strong></p>
                            <p>Об'єм моделі: ${volumeCm3.toFixed(2)} см³</p>
                            <p>Вага моделі: ${weightGrams.toFixed(2)} г</p>
                            <p><strong>Вартість друку: ~${priceUah.toFixed(2)} грн</strong></p>
                            <hr style="border-top: 1px solid #ccc; border-bottom: none; margin: 10px 0;">
                            <small>Це попередня вартість. Точна ціна буде відома після професійного аналізу моделі у слайсері та узгодження всіх деталей.</small>
                        `;
                    } else {
                         resultDiv.innerHTML = '<p>Не вдалося розрахувати об\'єм. Будь ласка, перевір, що модель є цілісною (watertight) та спробуй ще раз.</p>';
                    }

                } catch (error) {
                    console.error('Помилка обробки STL файлу:', error);
                    resultDiv.innerHTML = '<p>Помилка. Не вдалося обробити файл. Будь ласка, завантажте коректний .STL файл.</p>';
                }
            };

            reader.onerror = () => {
                resultDiv.innerHTML = '<p>Не вдалося прочитати файл.</p>';
            }

            reader.readAsArrayBuffer(file);
        });

        /**
         * Розраховує об'єм геометрії (mesh).
         * @param {THREE.BufferGeometry} geometry - геометрія моделі.
         * @returns {number} - об'єм моделі (в одиницях моделі, зазвичай мм³).
         */
        function calculateVolume(geometry) {
            if (!geometry.isBufferGeometry) {
                console.error('Geometry is not BufferGeometry');
                return 0;
            }

            let volume = 0;
            const position = geometry.attributes.position;
            const p1 = new THREE.Vector3();
            const p2 = new THREE.Vector3();
            const p3 = new THREE.Vector3();

            // STLLoader створює неіндексовану геометрію,
            // тому ми можемо просто ітерувати по трійках вершин.
            for (let i = 0; i < position.count; i += 3) {
                p1.fromBufferAttribute(position, i);
                p2.fromBufferAttribute(position, i + 1);
                p3.fromBufferAttribute(position, i + 2);

                // Формула для знакового об'єму тетраедра
                volume += p1.dot(p2.clone().cross(p3));
            }

            return Math.abs(volume / 6.0);
        }
        
        // Дозволяє завантажувати той самий файл повторно
        modelUploader.addEventListener('click', function() {
            this.value = null;
        });