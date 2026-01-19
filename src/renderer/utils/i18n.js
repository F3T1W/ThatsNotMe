/**
 * Localization strings for the application.
 */
const locales = {
    en: {
        // Sidebar
        "sidebar.title": "ThatsNotMe",
        "sidebar.home": "Home",
        "sidebar.dataset": "Training Dataset",
        "sidebar.train": "Train Model",
        "sidebar.test": "Test Dataset",
        "sidebar.swap": "Face Swap",
        "sidebar.settings": "Settings",

        // Home
        "home.dashboard": "Dashboard",
        "home.welcome": "Welcome to",
        "home.title": "ThatsNotMe",
        "home.description": "Create custom face swap models with an intuitive, end-to-end workflow. Upload photos, train your model, and swap faces all in one place.",
        "home.training_images": "Training Images",
        "home.models_trained": "Models Trained",
        "home.reset_stats": "Reset Statistics",
        "home.reset_confirm": "This will delete all training images and trained models. Are you sure?",

        // Dataset
        "dataset.title": "Training Dataset",
        "dataset.reset": "Reset",
        "dataset.select": "Select Training Images",
        "dataset.info": "Upload at least 10-20 photos of the same person.",
        "dataset.loading": "Loading...",
        "dataset.delete_confirm": "Are you sure you want to delete all training images? This cannot be undone.",
        "dataset.cleared": "Dataset cleared successfully",
        "dataset.clear_error": "Error clearing dataset",
        "dataset.saved": "Successfully saved {count} images",
        "dataset.validating": "Validating images for faces...",
        "dataset.validation_failed": "Validation failed",
        "dataset.warning_no_faces": "Warning: {count} images have no detected faces.",
        "dataset.all_valid": "All images have valid faces!",

        // Training
        "training.title": "Train Model",
        "training.model_name": "Model Name",
        "training.enter_name": "Enter model name",
        "training.helper": ".fsem will be appended automatically",
        "training.start": "Start Training",
        "training.progress": "Training Progress",
        "training.preparing": "Preparing...",
        "training.in_progress": "Training in progress...",
        
        // Face Swap
        "swap.title": "Face Swap",
        "swap.settings": "Settings",
        "swap.select_model": "Select Model",
        "swap.loading_models": "Loading models...",
        "swap.select_placeholder": "Select a trained model...",
        "swap.no_models": "No models found. Train one first!",
        "swap.error_loading": "Error loading models",
        "swap.target_photo": "Target Photo",
        "swap.choose_photo": "Choose Photo",
        "swap.enhance": "Enhance Face Quality",
        "swap.strength": "Enhancement Strength (Upscale)",
        "swap.normal": "Normal (1x)",
        "swap.strong": "Strong (2x)",
        "swap.desc": "Uses GFPGAN to restore details. Higher strength takes more time but gives clearer results.",
        "swap.start": "Swap Face",
        "swap.processing": "Processing...",
        "swap.wait": "Applying face swap. Please wait.",
        "swap.preview": "Preview",
        "swap.no_image": "No Image",
        "swap.select_target": "Select a target photo to start",
        "swap.result": "Result",

        // Settings
        "settings.title": "Settings",
        "settings.language": "Language",
        "settings.python_env": "Python Environment",
        "settings.python_status": "Python Status:",
        "settings.venv_status": "Virtual Environment:",
        "settings.pkg_status": "Packages:",
        "settings.check": "Check Python",
        "settings.setup": "Setup Environment",
        "settings.install": "Install Packages",
        "settings.updates": "Updates",
        "settings.current_version": "Current Version:",
        "settings.auto_update_disabled": "Auto-update is disabled. Please download updates manually from GitHub Releases.",
        "settings.download": "Download Latest Release",
        "settings.models_folder": "Models Folder",
        "settings.open_folder_desc": "Open the folder containing all trained model versions.",
        "settings.open_folder": "Open Models Folder",
        "settings.theme": "Theme",
        "settings.installed": "Installed",
        "settings.exists": "Exists",
        "settings.missing": "Missing",
        "settings.checking": "Checking...",
        "settings.unknown": "Unknown",
        "settings.setup_info": "Environment setup is handled automatically on startup.",

        // Test
        "test.title": "Batch Face Swap",
        "test.input_folder": "Input Folder",
        "test.select_folder_btn": "Select Folder with Photos",
        "test.no_folder": "No folder selected",
        "test.start_batch": "Start Batch Processing",
        "test.progress": "Progress",
        "test.eta": "ETA: {seconds}s",
        "test.processing": "Processing {current}/{total}: {filename}",
        "test.completed": "Completed!",
        "test.open_output": "Open Output Folder",
        "test.calculating": "Calculating ETA...",
        "test.initializing": "Initializing...",
        "test.failed": "Failed",
        "test.success_msg": "Batch processing complete! Processed {count} images.",
        "test.fail_msg": "Batch failed: {error}"
    },
    ru: {
        // Sidebar
        "sidebar.title": "ThatsNotMe",
        "sidebar.home": "Главная",
        "sidebar.dataset": "Датасет",
        "sidebar.train": "Обучение",
        "sidebar.test": "Тест",
        "sidebar.swap": "Замена Лица",
        "sidebar.settings": "Настройки",

        // Home
        "home.dashboard": "Дашборд",
        "home.welcome": "Добро пожаловать в",
        "home.title": "ThatsNotMe",
        "home.description": "Создавайте собственные модели замены лиц с интуитивно понятным рабочим процессом. Загружайте фото, обучайте модели и меняйте лица в одном месте.",
        "home.training_images": "Фото для обучения",
        "home.models_trained": "Моделей обучено",
        "home.reset_stats": "Сбросить статистику",
        "home.reset_confirm": "Это удалит все фото обучения и обученные модели. Вы уверены?",

        // Dataset
        "dataset.title": "Датасет для обучения",
        "dataset.reset": "Сбросить",
        "dataset.select": "Выбрать фото",
        "dataset.info": "Загрузите минимум 10-20 фотографий одного человека.",
        "dataset.loading": "Загрузка...",
        "dataset.delete_confirm": "Вы уверены, что хотите удалить все фото? Это действие необратимо.",
        "dataset.cleared": "Датасет успешно очищен",
        "dataset.clear_error": "Ошибка очистки датасета",
        "dataset.saved": "Успешно сохранено {count} фото",
        "dataset.validating": "Проверка лиц на фото...",
        "dataset.validation_failed": "Проверка не удалась",
        "dataset.warning_no_faces": "Внимание: на {count} фото не найдены лица.",
        "dataset.all_valid": "На всех фото найдены лица!",

        // Training
        "training.title": "Обучение Модели",
        "training.model_name": "Название модели",
        "training.enter_name": "Введите название",
        "training.helper": ".fsem будет добавлено автоматически",
        "training.start": "Начать обучение",
        "training.progress": "Прогресс обучения",
        "training.preparing": "Подготовка...",
        "training.in_progress": "Идет обучение...",

        // Face Swap
        "swap.title": "Замена Лица",
        "swap.settings": "Настройки",
        "swap.select_model": "Выберите модель",
        "swap.loading_models": "Загрузка моделей...",
        "swap.select_placeholder": "Выберите обученную модель...",
        "swap.no_models": "Модели не найдены. Сначала обучите модель!",
        "swap.error_loading": "Ошибка загрузки моделей",
        "swap.target_photo": "Целевое фото",
        "swap.choose_photo": "Выбрать фото",
        "swap.enhance": "Улучшить качество лица",
        "swap.strength": "Сила улучшения (Upscale)",
        "swap.normal": "Нормально (1x)",
        "swap.strong": "Сильно (2x)",
        "swap.desc": "Использует GFPGAN для восстановления деталей. Высокая сила требует больше времени, но дает более четкий результат.",
        "swap.start": "Заменить лицо",
        "swap.processing": "Обработка...",
        "swap.wait": "Применение замены лица. Пожалуйста, подождите.",
        "swap.preview": "Предпросмотр",
        "swap.no_image": "Нет фото",
        "swap.select_target": "Выберите целевое фото для начала",
        "swap.result": "Результат",

        // Settings
        "settings.title": "Настройки",
        "settings.language": "Язык",
        "settings.python_env": "Python Окружение",
        "settings.python_status": "Статус Python:",
        "settings.venv_status": "Виртуальное окружение:",
        "settings.pkg_status": "Пакеты:",
        "settings.check": "Проверить Python",
        "settings.setup": "Настроить окружение",
        "settings.install": "Установить пакеты",
        "settings.updates": "Обновления",
        "settings.current_version": "Текущая версия:",
        "settings.auto_update_disabled": "Автообновление отключено. Пожалуйста, скачайте обновления вручную с GitHub Releases.",
        "settings.download": "Скачать последний релиз",
        "settings.models_folder": "Папка Моделей",
        "settings.open_folder_desc": "Открыть папку со всеми обученными моделями.",
        "settings.open_folder": "Открыть папку моделей",
        "settings.theme": "Тема",
        "settings.installed": "Установлен",
        "settings.exists": "Существует",
        "settings.missing": "Отсутствует",
        "settings.checking": "Проверка...",
        "settings.unknown": "Неизвестно",
        "settings.setup_info": "Настройка окружения выполняется автоматически при запуске.",

        // Test
        "test.title": "Пакетная Замена Лиц",
        "test.input_folder": "Папка с Фото",
        "test.select_folder_btn": "Выбрать Папку с Фото",
        "test.no_folder": "Папка не выбрана",
        "test.start_batch": "Начать Обработку",
        "test.progress": "Прогресс",
        "test.eta": "Осталось: {seconds}сек",
        "test.processing": "Обработка {current}/{total}: {filename}",
        "test.completed": "Готово!",
        "test.open_output": "Открыть Папку Результата",
        "test.calculating": "Расчет времени...",
        "test.initializing": "Инициализация...",
        "test.failed": "Ошибка",
        "test.success_msg": "Пакетная обработка завершена! Обработано {count} фото.",
        "test.fail_msg": "Ошибка обработки: {error}"
    },
    ja: {
        // Sidebar
        "sidebar.title": "ThatsNotMe",
        "sidebar.home": "ホーム",
        "sidebar.dataset": "トレーニングデータ",
        "sidebar.train": "モデル学習",
        "sidebar.test": "テストデータ",
        "sidebar.swap": "顔交換",
        "sidebar.settings": "設定",

        // Home
        "home.dashboard": "ダッシュボード",
        "home.welcome": "ようこそ",
        "home.title": "ThatsNotMe",
        "home.description": "直感的で包括的なワークフローでカスタム顔交換モデルを作成します。写真のアップロード、モデルの学習、顔の交換をすべて1か所で行えます。",
        "home.training_images": "トレーニング画像",
        "home.models_trained": "学習済みモデル",
        "home.reset_stats": "統計をリセット",
        "home.reset_confirm": "これにより、すべてのトレーニング画像と学習済みモデルが削除されます。よろしいですか？",

        // Dataset
        "dataset.title": "トレーニングデータセット",
        "dataset.reset": "リセット",
        "dataset.select": "画像を選択",
        "dataset.info": "同一人物の写真を少なくとも10〜20枚アップロードしてください。",
        "dataset.loading": "読み込み中...",
        "dataset.delete_confirm": "すべてのトレーニング画像を削除してもよろしいですか？この操作は取り消せません。",
        "dataset.cleared": "データセットが正常に消去されました",
        "dataset.clear_error": "データセットの消去エラー",
        "dataset.saved": "{count} 枚の画像を保存しました",
        "dataset.validating": "顔画像を検証中...",
        "dataset.validation_failed": "検証に失敗しました",
        "dataset.warning_no_faces": "警告: {count} 枚の画像で顔が検出されませんでした。",
        "dataset.all_valid": "すべての画像で顔が検出されました！",

        // Training
        "training.title": "モデル学習",
        "training.model_name": "モデル名",
        "training.enter_name": "モデル名を入力",
        "training.helper": ".fsem は自動的に追加されます",
        "training.start": "学習開始",
        "training.progress": "学習状況",
        "training.preparing": "準備中...",
        "training.in_progress": "学習中...",

        // Face Swap
        "swap.title": "顔交換",
        "swap.settings": "設定",
        "swap.select_model": "モデル選択",
        "swap.loading_models": "モデル読み込み中...",
        "swap.select_placeholder": "学習済みモデルを選択...",
        "swap.no_models": "モデルが見つかりません。まず学習してください！",
        "swap.error_loading": "モデル読み込みエラー",
        "swap.target_photo": "ターゲット写真",
        "swap.choose_photo": "写真を選択",
        "swap.enhance": "顔質向上",
        "swap.strength": "強化強度 (Upscale)",
        "swap.normal": "通常 (1x)",
        "swap.strong": "強力 (2x)",
        "swap.desc": "GFPGANを使用して詳細を復元します。強度が高いほど時間がかかりますが、より鮮明な結果が得られます。",
        "swap.start": "顔交換実行",
        "swap.processing": "処理中...",
        "swap.wait": "顔交換を適用しています。お待ちください。",
        "swap.preview": "プレビュー",
        "swap.no_image": "画像なし",
        "swap.select_target": "ターゲット写真を選択してください",
        "swap.result": "結果",

        // Settings
        "settings.title": "設定",
        "settings.language": "言語",
        "settings.python_env": "Python環境",
        "settings.python_status": "Pythonステータス:",
        "settings.venv_status": "仮想環境:",
        "settings.pkg_status": "パッケージ:",
        "settings.check": "Python確認",
        "settings.setup": "環境セットアップ",
        "settings.install": "パッケージインストール",
        "settings.updates": "アップデート",
        "settings.current_version": "現在のバージョン:",
        "settings.auto_update_disabled": "自動更新は無効です。GitHubリリースから手動でダウンロードしてください。",
        "settings.download": "最新リリースをダウンロード",
        "settings.models_folder": "モデルフォルダ",
        "settings.open_folder_desc": "学習済みモデルのフォルダを開きます。",
        "settings.open_folder": "モデルフォルダを開く",
        "settings.theme": "テーマ",
        "settings.installed": "インストール済",
        "settings.exists": "存在します",
        "settings.missing": "見つかりません",
        "settings.checking": "確認中...",
        "settings.unknown": "不明",
        "settings.setup_info": "環境設定は起動時に自動的に処理されます。",

        // Test
        "test.title": "一括顔交換",
        "test.input_folder": "入力フォルダ",
        "test.select_folder_btn": "写真フォルダを選択",
        "test.no_folder": "フォルダが選択されていません",
        "test.start_batch": "一括処理開始",
        "test.progress": "進捗",
        "test.eta": "残り時間: {seconds}秒",
        "test.processing": "処理中 {current}/{total}: {filename}",
        "test.completed": "完了！",
        "test.open_output": "出力フォルダを開く",
        "test.calculating": "計算中...",
        "test.initializing": "初期化中...",
        "test.failed": "失敗",
        "test.success_msg": "一括処理完了！ {count} 枚を処理しました。",
        "test.fail_msg": "一括処理失敗: {error}"
    },
    uz: {
        // Sidebar
        "sidebar.title": "ThatsNotMe",
        "sidebar.home": "Bosh Sahifa",
        "sidebar.dataset": "Ma'lumotlar To'plami",
        "sidebar.train": "Modelni O'qitish",
        "sidebar.test": "Sinov To'plami",
        "sidebar.swap": "Yuz Almashtirish",
        "sidebar.settings": "Sozlamalar",

        // Home
        "home.dashboard": "Boshqaruv Paneli",
        "home.welcome": "Xush kelibsiz",
        "home.title": "ThatsNotMe",
        "home.description": "Intuitiv ish jarayoni bilan shaxsiy yuz almashtirish modellarini yarating. Rasmlarni yuklang, modelingizni o'qiting va yuzlarni bir joyda almashtiring.",
        "home.training_images": "O'qitish Rasmlari",
        "home.models_trained": "O'qitilgan Modellar",
        "home.reset_stats": "Statistikani Qayta Sozlash",
        "home.reset_confirm": "Bu barcha o'qitish rasmlari va o'qitilgan modellarni o'chirib tashlaydi. Ishonchingiz komilmi?",

        // Dataset
        "dataset.title": "O'qitish To'plami",
        "dataset.reset": "Qayta Sozlash",
        "dataset.select": "Rasmlarni Tanlash",
        "dataset.info": "Bir kishining kamida 10-20 ta rasmini yuklang.",
        "dataset.loading": "Yuklanmoqda...",
        "dataset.delete_confirm": "Barcha rasmlarni o'chirib tashlashga ishonchingiz komilmi? Bu amalni bekor qilib bo'lmaydi.",
        "dataset.cleared": "To'plam muvaffaqiyatli tozalandi",
        "dataset.clear_error": "To'plamni tozalashda xatolik",
        "dataset.saved": "{count} ta rasm saqlandi",
        "dataset.validating": "Rasmlardagi yuzlar tekshirilmoqda...",
        "dataset.validation_failed": "Tekshirish muvaffaqiyatsiz tugadi",
        "dataset.warning_no_faces": "Ogohlantirish: {count} ta rasmda yuz topilmadi.",
        "dataset.all_valid": "Barcha rasmlarda yuzlar topildi!",

        // Training
        "training.title": "Modelni O'qitish",
        "training.model_name": "Model Nomi",
        "training.enter_name": "Nom kiriting",
        "training.helper": ".fsem avtomatik qo'shiladi",
        "training.start": "O'qitishni Boshlash",
        "training.progress": "Jarayon",
        "training.preparing": "Tayyorlanmoqda...",
        "training.in_progress": "O'qitish jarayoni...",

        // Face Swap
        "swap.title": "Yuz Almashtirish",
        "swap.settings": "Sozlamalar",
        "swap.select_model": "Modelni Tanlang",
        "swap.loading_models": "Modellar yuklanmoqda...",
        "swap.select_placeholder": "O'qitilgan modelni tanlang...",
        "swap.no_models": "Modellar topilmadi. Avval o'qiting!",
        "swap.error_loading": "Modellarni yuklashda xatolik",
        "swap.target_photo": "Maqsadli Rasm",
        "swap.choose_photo": "Rasm Tanlash",
        "swap.enhance": "Yuz Sifatini Oshirish",
        "swap.strength": "Kuchaytirish Darajasi (Upscale)",
        "swap.normal": "Normal (1x)",
        "swap.strong": "Kuchli (2x)",
        "swap.desc": "Tafsilotlarni tiklash uchun GFPGAN ishlatiladi. Yuqori kuchaytirish ko'proq vaqt oladi, lekin tiniqroq natija beradi.",
        "swap.start": "Yuzni Almashtirish",
        "swap.processing": "Qayta ishlanmoqda...",
        "swap.wait": "Yuz almashtirish qo'llanilmoqda. Iltimos kuting.",
        "swap.preview": "Ko'rib chiqish",
        "swap.no_image": "Rasm Yo'q",
        "swap.select_target": "Boshlash uchun rasmni tanlang",
        "swap.result": "Natija",

        // Settings
        "settings.title": "Sozlamalar",
        "settings.language": "Til",
        "settings.python_env": "Python Muhiti",
        "settings.python_status": "Python Holati:",
        "settings.venv_status": "Virtual Muhit:",
        "settings.pkg_status": "Paketlar:",
        "settings.check": "Pythonni Tekshirish",
        "settings.setup": "Muhitni Sozlash",
        "settings.install": "Paketlarni O'rnatish",
        "settings.updates": "Yangilanishlar",
        "settings.current_version": "Joriy Versiya:",
        "settings.auto_update_disabled": "Avtomatik yangilash o'chirilgan. Iltimos, yangilanishlarni GitHub Releases-dan qo'lda yuklab oling.",
        "settings.download": "So'nggi Versiyani Yuklab Olish",
        "settings.models_folder": "Modellar Papkasi",
        "settings.open_folder_desc": "Barcha o'qitilgan modellar papkasini ochish.",
        "settings.open_folder": "Modellar Papkasini Ochish",
        "settings.theme": "Mavzu",
        "settings.installed": "O'rnatilgan",
        "settings.exists": "Mavjud",
        "settings.missing": "Yo'qolgan",
        "settings.checking": "Tekshirilmoqda...",
        "settings.unknown": "Noma'lum",
        "settings.setup_info": "Muhitni sozlash ishga tushirilganda avtomatik bajariladi.",

        // Test
        "test.title": "Ommaviy Yuz Almashtirish",
        "test.input_folder": "Kirish Papkasi",
        "test.select_folder_btn": "Rasmlar Papkasini Tanlash",
        "test.no_folder": "Papka tanlanmagan",
        "test.start_batch": "Ommaviy Ishlovni Boshlash",
        "test.progress": "Jarayon",
        "test.eta": "Qolgan vaqt: {seconds}s",
        "test.processing": "Qayta ishlanmoqda {current}/{total}: {filename}",
        "test.completed": "Bajarildi!",
        "test.open_output": "Natija Papkasini Ochish",
        "test.calculating": "Vaqt hisoblanmoqda...",
        "test.initializing": "Ishga tushirilmoqda...",
        "test.failed": "Xatolik",
        "test.success_msg": "Ommaviy ishlov berish yakunlandi! {count} ta rasm qayta ishlandi.",
        "test.fail_msg": "Ommaviy ishlovda xatolik: {error}"
    }
};

class I18n {
    constructor() {
        this.locale = localStorage.getItem('language') || 'en';
        this.observers = [];
    }

    setLocale(locale) {
        if (locales[locale]) {
            this.locale = locale;
            localStorage.setItem('language', locale);
            this.updateAll();
        }
    }

    t(key) {
        return locales[this.locale]?.[key] || key;
    }

    updateAll() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                    el.placeholder = this.t(key);
                } else {
                    el.innerText = this.t(key);
                }
            }
        });
        // Dispatch event for dynamic content
        window.dispatchEvent(new CustomEvent('language-changed', { detail: { locale: this.locale } }));
    }
}

module.exports = { i18n: new I18n() };
