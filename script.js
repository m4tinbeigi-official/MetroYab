document.addEventListener('DOMContentLoaded', function () {
    const sourceSelect = document.getElementById('source');
    const destinationSelect = document.getElementById('destination');
    const findRouteButton = document.getElementById('find-route');
    const saveRouteButton = document.getElementById('save-route');
    const shareRouteButton = document.getElementById('share-route');
    const printRouteButton = document.getElementById('print-route');
    const routeResult = document.getElementById('route-result');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const map = L.map('map').setView([35.6892, 51.3890], 12); // مختصات تهران

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    let stations = {};
    let savedRoutes = JSON.parse(localStorage.getItem('savedRoutes')) || [];

    // بارگذاری داده‌های مترو از آدرس JSON با استفاده از پروکسی
    fetch('https://m4tinbeigi-official.github.io/tehran-metro-data/data/stations.json')
        .then(response => response.json())
        .then(data => {
            console.log(data); // چاپ داده‌ها در کنسول
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

    // بررسی خطوط مشترک
    function hasCommonLine(sourceKey, destinationKey) {
        const sourceLines = stations[sourceKey].lines;
        const destinationLines = stations[destinationKey].lines;
        return sourceLines.some(line => destinationLines.includes(line));
    }

    // پیدا کردن مسیر مستقیم در یک خط
    function findDirectRoute(sourceKey, destinationKey) {
        const commonLine = stations[sourceKey].lines.find(line => stations[destinationKey].lines.includes(line));
        if (!commonLine) return null;

        const route = [sourceKey];
        let currentStation = sourceKey;

        while (currentStation !== destinationKey) {
            const nextStation = stations[currentStation].relations.find(neighbor => 
                stations[neighbor].lines.includes(commonLine)
            );
            if (!nextStation) return null;
            route.push(nextStation);
            currentStation = nextStation;
        }

        return route;
    }

    // الگوریتم ساده برای پیدا کردن مسیر (BFS)
    function findRoute(sourceKey, destinationKey) {
        // اگر مبدأ و مقصد در یک خط هستند، مسیر مستقیم را پیدا کنید
        if (hasCommonLine(sourceKey, destinationKey)) {
            const directRoute = findDirectRoute(sourceKey, destinationKey);
            if (directRoute) return directRoute;
        }

        // در غیر این صورت، از BFS استفاده کنید
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

        let routeHTML = '<h2>مسیر پیشنهادی:</h2>';
        let previousLine = null;
        let totalTime = 0;

        route.forEach((stationKey, index) => {
            const station = stations[stationKey];
            const currentLine = station.lines[0]; // فرض می‌کنیم هر ایستگاه حداقل یک خط دارد

            if (previousLine && currentLine !== previousLine) {
                routeHTML += `
                    <div class="line-change">
                        <i class="fas fa-exchange-alt"></i> تغییر خط از ${previousLine} به ${currentLine}
                    </div>
                `;
                totalTime += 5; // 5 دقیقه برای تغییر خط
            }

            routeHTML += `
                <div class="route-card">
                    <div class="card-body">
                        <h5 class="card-title">${station.translations.fa}</h5>
                        <p class="card-text">خط ${currentLine}</p>
                    </div>
                </div>
            `;
            totalTime += 2; // 2 دقیقه برای هر ایستگاه
            previousLine = currentLine;
        });

        routeHTML += `
            <div class="travel-time">
                <i class="fas fa-clock"></i> زمان تقریبی سفر: ${totalTime} دقیقه
            </div>
        `;
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

    // ذخیره مسیر
    saveRouteButton.addEventListener('click', function () {
        const sourceKey = sourceSelect.value;
        const destinationKey = destinationSelect.value;

        if (!sourceKey || !destinationKey) {
            alert('لطفاً ایستگاه مبدأ و مقصد را انتخاب کنید.');
            return;
        }

        const route = findRoute(sourceKey, destinationKey);
        if (route) {
            savedRoutes.push({ source: sourceKey, destination: destinationKey, route: route });
            localStorage.setItem('savedRoutes', JSON.stringify(savedRoutes));
            alert('مسیر ذخیره شد!');
        }
    });

    // به‌اشتراک‌گذاری مسیر
    shareRouteButton.addEventListener('click', function () {
        const sourceKey = sourceSelect.value;
        const destinationKey = destinationSelect.value;

        if (!sourceKey || !destinationKey) {
            alert('لطفاً ایستگاه مبدأ و مقصد را انتخاب کنید.');
            return;
        }

        const route = findRoute(sourceKey, destinationKey);
        if (route) {
            const routeText = route.map(stationKey => stations[stationKey].translations.fa).join(' -> ');
            const shareUrl = `${window.location.href}?source=${sourceKey}&destination=${destinationKey}`;
            navigator.clipboard.writeText(`مسیر مترو: ${routeText}\nلینک مسیر: ${shareUrl}`)
                .then(() => alert('مسیر کپی شد!'))
                .catch(() => alert('خطا در کپی کردن مسیر!'));
        }
    });

    // چاپ مسیر
    printRouteButton.addEventListener('click', function () {
        window.print();
    });
});