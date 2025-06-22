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
         /* === Нова логіка розрахунку вартості 3D-моделі === */
    const calculateBtn = document.getElementById('calculateBtn');
    const modelUploader = document.getElementById('modelUploader');
    const resultDiv = document.getElementById('calculationResult');

    // --- Параметри для розрахунку ---
    // ОНОВЛЕНО: Нова ціна за грам пластику
    const PRICE_PER_GRAM = 2.50; 
    // Щільність PLA пластику в г/см³. Це значення можна коригувати.
    const PLA_DENSITY_G_CM3 = 1.24; 

    // Обробник кліку на кнопку "Розрахувати"
    calculateBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Запобігаємо стандартній поведінці посилання
        modelUploader.click(); // Імітуємо клік на прихований input для завантаження файлу
    });

    // Обробник зміни файлу в input
    modelUploader.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            return; // Якщо файл не вибрано, нічого не робимо
        }

        // Показуємо блок з результатом та повідомлення про аналіз
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div class="loader"></div><p>Аналізую модель, будь ласка, зачекайте...</p>';

        const reader = new FileReader();

        reader.onload = (e) => {
            const fileContent = e.target.result;
            const fileExtension = file.name.split('.').pop().toLowerCase();
            let loader;
            
            // Вибираємо потрібний завантажувач залежно від розширення файлу
            switch (fileExtension) {
                case 'stl':
                    loader = new THREE.STLLoader();
                    break;
                case 'obj':
                    loader = new THREE.OBJLoader();
                    break;
                default:
                    resultDiv.innerHTML = `<p>Помилка: формат файлу .${fileExtension} не підтримується. Будь ласка, завантажте .STL або .OBJ файл.</p>`;
                    return;
            }

            try {
                // Парсимо модель і отримуємо геометрію
                const geometryOrObject = loader.parse(fileContent);
                let geometry;

                // STLLoader повертає BufferGeometry, а OBJLoader - Group (об'єкт).
                // Нам потрібно знайти геометрію всередині об'єкта.
                if (geometryOrObject.isBufferGeometry) {
                    geometry = geometryOrObject;
                } else {
                    // Шукаємо перший Mesh в сцені і беремо його геометрію
                    geometryOrObject.traverse(function (child) {
                        if (child.isMesh) {
                            geometry = child.geometry;
                        }
                    });
                }
                
                if (!geometry) {
                    throw new Error("Не вдалося знайти геометрію у файлі.");
                }

                // Моделі зазвичай створюються в мм, тому об'єм буде в мм³.
                // Конвертуємо в см³ (1 см³ = 1000 мм³)
                const volumeCm3 = calculateVolume(geometry) / 1000;
                
                if (volumeCm3 > 0) {
                    const weightGrams = volumeCm3 * PLA_DENSITY_G_CM3;
                    const priceUah = weightGrams * PRICE_PER_GRAM;

                    // Формуємо красивий вивід результату
                    resultDiv.innerHTML = `
                        <p><strong>Орієнтовний розрахунок для PLA пластику:</strong></p>
                        <p>Об'єм моделі: ${volumeCm3.toFixed(2)} см³</p>
                        <p>Приблизна вага: ${weightGrams.toFixed(2)} г</p>
                        <p class="price"><strong>Вартість друку: ~${priceUah.toFixed(2)} грн</strong></p>
                        <hr style="border-top: 1px solid #ccc; border-bottom: none; margin: 10px 0;">
                        <small><strong>Увага:</strong> Це попередня вартість для суцільної моделі. Точна ціна буде відома після обробки моделі у професійному слайсері та узгодження параметрів друку (заповнення, підтримки тощо).</small>
                    `;
                } else {
                    resultDiv.innerHTML = '<p>Не вдалося розрахувати об\'єм. Будь ласка, перевірте, що модель є цілісною (watertight) та має коректний масштаб.</p>';
                }

            } catch (error) {
                console.error('Помилка обробки 3D файлу:', error);
                resultDiv.innerHTML = `<p>Помилка. Не вдалося обробити файл. Будь ласка, завантажте коректний .STL або .OBJ файл.</p>`;
            }
        };

        reader.onerror = () => {
            resultDiv.innerHTML = '<p>Не вдалося прочитати файл.</p>';
        };

        // Для STLLoader потрібен ArrayBuffer, для OBJLoader - текст. 
        // readAsArrayBuffer працює для обох, тому що OBJLoader може обробляти і його.
        reader.readAsArrayBuffer(file);
    });

    /**
     * Розраховує об'єм геометрії (mesh) методом тетраедрів.
     * @param {THREE.BufferGeometry} geometry - геометрія моделі.
     * @returns {number} - об'єм моделі (в одиницях моделі, зазвичай мм³).
     */
    function calculateVolume(geometry) {
        if (!geometry.isBufferGeometry) {
            console.error('На вхід подано не BufferGeometry');
            return 0;
        }

        let volume = 0;
        const position = geometry.attributes.position;
        const p1 = new THREE.Vector3();
        const p2 = new THREE.Vector3();
        const p3 = new THREE.Vector3();
        
        // Перевіряємо, чи геометрія індексована
        if (geometry.index) {
            const index = geometry.index;
            for (let i = 0; i < index.count; i += 3) {
                p1.fromBufferAttribute(position, index.getX(i));
                p2.fromBufferAttribute(position, index.getX(i + 1));
                p3.fromBufferAttribute(position, index.getX(i + 2));
                volume += signedVolumeOfTriangle(p1, p2, p3);
            }
        } else {
            // Для неіндексованої геометрії (як у STL)
            for (let i = 0; i < position.count; i += 3) {
                p1.fromBufferAttribute(position, i);
                p2.fromBufferAttribute(position, i + 1);
                p3.fromBufferAttribute(position, i + 2);
                volume += signedVolumeOfTriangle(p1, p2, p3);
            }
        }

        return Math.abs(volume);
    }
    
    /**
     * Допоміжна функція для розрахунку знакового об'єму тетраедра.
     */
    function signedVolumeOfTriangle(p1, p2, p3) {
        return p1.dot(p2.cross(p3)) / 6.0;
    }

    // Дозволяє завантажувати той самий файл повторно (корисно для тестування)
    modelUploader.addEventListener('click', function() {
        this.value = null;
    });
});