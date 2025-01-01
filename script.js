document.addEventListener('DOMContentLoaded', function () {
    const sourceSelect = document.getElementById('source');
    const destinationSelect = document.getElementById('destination');
    const findRouteButton = document.getElementById('find-route');
    const routeResult = document.getElementById('route-result');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const map = L.map('map').setView([35.6892, 51.3890], 12); // مختصات تهران

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    let stations = {};

    // بارگذاری داده‌های مترو از آدرس JSON با استفاده از پروکسی
    fetch('https://cors-anywhere.herokuapp.com/https://m4tinbeigi-official.github.io/tehran-metro-data/data/stations.json')
        .then(response => response.json())
        .then(data => {
            stations = data;
            populateSelects();
            initializeSelect2();
        })
        .catch(error => console.error('Error loading data:', error));

    // پر کردن dropdownها با ایستگاه‌ها
    function populateSelects() {
        for (const key in stations) {
            const station = stations[key];
            const option = document.createElement('option');
            option.value = key; // استفاده از کلید به عنوان مقدار
            option.textContent = station.translations.fa; // نمایش نام فارسی ایستگاه
            sourceSelect.appendChild(option.cloneNode(true));
            destinationSelect.appendChild(option);
        }
    }

    // Initialize Select2
    function initializeSelect2() {
        $(sourceSelect).select2({
            placeholder: "ایستگاه مبدأ را انتخاب کنید",
            allowClear: true
        });
        $(destinationSelect).select2({
            placeholder: "ایستگاه مقصد را انتخاب کنید",
            allowClear: true
        });
    }

    // پیدا کردن مسیر
    findRouteButton.addEventListener('click', function () {
        const sourceKey = sourceSelect.value;
        const destinationKey = destinationSelect.value;

        if (!sourceKey || !destinationKey) {
            alert('لطفاً ایستگاه مبدأ و مقصد را انتخاب کنید.');
            return;
        }

        const route = findRoute(sourceKey, destinationKey);
        displayRoute(route);
    });

    // الگوریتم ساده برای پیدا کردن مسیر (BFS)
    function findRoute(sourceKey, destinationKey) {
        const queue = [{ station: sourceKey, path: [sourceKey] }];
        const visited = new Set();

        while (queue.length > 0) {
            const current = queue.shift();
            if (current.station === destinationKey) {
                return current.path;
            }
            if (visited.has(current.station)) {
                continue;
            }
            visited.add(current.station);

            const currentStation = stations[current.station];
            if (currentStation.relations) {
                currentStation.relations.forEach(neighbor => {
                    queue.push({ station: neighbor, path: [...current.path, neighbor] });
                });
            }
        }
        return null;
    }

    // نمایش مسیر
    function displayRoute(route) {
        if (!route) {
            routeResult.innerHTML = '<p class="text-danger">مسیری پیدا نشد!</p>';
            return;
        }

        let routeHTML = '<h2>مسیر پیشنهادی:</h2><ul class="list-group">';
        let previousLine = null;
        let totalTime = 0;

        route.forEach((stationKey, index) => {
            const station = stations[stationKey];
            const currentLine = station.lines[0]; // فرض می‌کنیم هر ایستگاه حداقل یک خط دارد

            if (previousLine && currentLine !== previousLine) {
                routeHTML += `<li class="list-group-item list-group-item-warning">تغییر خط از ${previousLine} به ${currentLine}</li>`;
                totalTime += 5; // 5 دقیقه برای تغییر خط
            }

            routeHTML += `<li class="list-group-item" style="border-left: 5px solid ${getLineColor(currentLine)};">${station.translations.fa} (خط ${currentLine})</li>`;
            totalTime += 2; // 2 دقیقه برای هر ایستگاه
            previousLine = currentLine;
        });

        routeHTML += `</ul><p class="mt-3">زمان تقریبی سفر: ${totalTime} دقیقه</p>`;
        routeResult.innerHTML = routeHTML;

        // نمایش مسیر روی نقشه
        const routeCoordinates = route.map(stationKey => {
            const station = stations[stationKey];
            return [station.latitude, station.longitude];
        });

        L.polyline(routeCoordinates, { color: 'blue' }).addTo(map);
        map.fitBounds(routeCoordinates);
    }

    // تابع برای دریافت رنگ خطوط
    function getLineColor(line) {
        const lineColors = {
            1: '#E0001F', // قرمز
            2: '#2F4389', // آبی
            3: '#67C5F5', // آبی روشن
            4: '#F8E100', // زرد
            5: '#007E46', // سبز
            6: '#EF639F', // صورتی
            7: '#7F0B74'  // بنفش
        };
        return lineColors[line] || '#000000'; // رنگ پیش‌فرض سیاه
    }

    // حالت تاریک
    darkModeToggle.addEventListener('click', function () {
        document.body.classList.toggle('dark-mode');
    });
});