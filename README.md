# burnarchive-shop

Сайт-витрина телеграм-канала [burnarchive](https://t.me/burnarchive44). Заказ — [@burnadmin](https://t.me/burnadmin).

## Как обновлять товары
Все вещи лежат в `data.js` (массив `products`). У каждой вещи:
- `status`: `in` — в наличии, `transit` — едет ко мне, `order` — под заказ, `sold` — продано (уходит в архив)
- `price` в гривнах (`0` = цена по запросу), `size`, `cond`, `desc`
- `photos`: пути к фото в папке `img/`
- `post`: ссылка на пост в канале

Продал вещь — поменяй `status` на `"sold"`, закоммить, GitHub Pages обновится сам за минуту.
