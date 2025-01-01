document.addEventListener('DOMContentLoaded', function () {
    const sourceSelect = document.getElementById('source');
    const destinationSelect = document.getElementById('destination');
    const findRouteButton = document.getElementById('find-route');
    const routeResult = document.getElementById('route-result');

    let stations = [];

    // بارگذاری داده‌های مترو از آدرس JSON
    fetch('https://m4tinbeigi-official.github.io/tehran-metro-data/data/stations.json')
        .then(response => response.json())
        .then(data => {
            stations = data;
            populateSelects();
        })
        .catch(error => console.error('Error loading data:', error));

    // پر کردن dropdownها با ایستگاه‌ها
    function populateSelects() {
        stations.forEach(station => {
            const option = document.createElement('option');
            option.value = station.id; // استفاده از id به عنوان مقدار
            option.textContent = station.name; // نمایش نام ایستگاه
            sourceSelect.appendChild(option.cloneNode(true));
            destinationSelect.appendChild(option);
        });
    }

    // پیدا کردن مسیر
    findRouteButton.addEventListener('click', function () {
        const sourceId = sourceSelect.value;
        const destinationId = destinationSelect.value;

        if (!sourceId || !destinationId) {
            alert('لطفاً ایستگاه مبدأ و مقصد را انتخاب کنید.');
            return;
        }

        const source = stations.find(station => station.id === parseInt(sourceId));
        const destination = stations.find(station => station.id === parseInt(destinationId));

        if (!source || !destination) {
            alert('ایستگاه‌های انتخاب شده معتبر نیستند.');
            return;
        }

        const route = findRoute(source, destination);
        displayRoute(route);
    });

    // الگوریتم ساده برای پیدا کردن مسیر (BFS)
    function findRoute(source, destination) {
        const queue = [{ station: source, path: [source] }];
        const visited = new Set();

        while (queue.length > 0) {
            const current = queue.shift();
            if (current.station.id === destination.id) {
                return current.path;
            }
            if (visited.has(current.station.id)) {
                continue;
            }
            visited.add(current.station.id);

            // پیدا کردن ایستگاه‌های متصل (به‌صورت فرضی)
            const connections = getConnections(current.station);
            connections.forEach(neighbor => {
                queue.push({ station: neighbor, path: [...current.path, neighbor] });
            });
        }
        return null;
    }

    // تابع فرضی برای پیدا کردن ایستگاه‌های متصل
    function getConnections(station) {
        // اینجا می‌توانید منطق خود را برای پیدا کردن ایستگاه‌های متصل پیاده‌سازی کنید.
        // به‌عنوان مثال، می‌توانید ایستگاه‌های هم‌خط را به‌عنوان متصل در نظر بگیرید.
        return stations.filter(s => s.line === station.line && s.id !== station.id);
    }

    // نمایش مسیر
    function displayRoute(route) {
        if (!route) {
            routeResult.innerHTML = '<p class="text-danger">مسیری پیدا نشد!</p>';
            return;
        }

        routeResult.innerHTML = `
            <h2>مسیر پیشنهادی:</h2>
            <ul class="list-group">
                ${route.map(station => `<li class="list-group-item">${station.name} (خط ${station.line})</li>`).join('')}
            </ul>
        `;
    }
});