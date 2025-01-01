document.addEventListener('DOMContentLoaded', function () {
    const sourceSelect = document.getElementById('source');
    const destinationSelect = document.getElementById('destination');
    const findRouteButton = document.getElementById('find-route');
    const routeResult = document.getElementById('route-result');

    let stations = {};

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
        for (const key in stations) {
            const station = stations[key];
            const option = document.createElement('option');
            option.value = key; // استفاده از کلید به عنوان مقدار
            option.textContent = station.translations.fa; // نمایش نام فارسی ایستگاه
            sourceSelect.appendChild(option.cloneNode(true));
            destinationSelect.appendChild(option);
        }
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

        routeResult.innerHTML = `
            <h2>مسیر پیشنهادی:</h2>
            <ul class="list-group">
                ${route.map(stationKey => {
                    const station = stations[stationKey];
                    return `<li class="list-group-item">${station.translations.fa} (خط ${station.lines.join(', ')})</li>`;
                }).join('')}
            </ul>
        `;
    }
});