/* break-ui: «худший случай» для проверки. Работает ТОЛЬКО на localhost и только с ?data=…
   На опубликованном сайте ничего не делает. Данные подменяются на входе (как при загрузке с сервера), сами компоненты не трогаются. */
(function () {
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (!local) return;
  const mode = new URLSearchParams(location.search).get('data');
  if (!mode) return;

  if (mode === 'worst') {
    // Длинное, но правдоподобное название и роли (реальные пьесы и программки бывают такими)
    SHOWS.worst = {
      title: 'Балаганчик. Двенадцать. Стихотворения Александра Александровича Блока',
      sub: 'пластический спектакль по произведениям А. А. Блока, два действия с антрактом',
      duration: '2 часа 40 минут с антрактом',
      text: ['Описание спектакля.'],
      creators: [['художники по костюмам', ['Валерия Севостьянова', 'Арина Попова', 'Артём Никитенко']]],
      cast: [
        ['Симеонов-Пищик Борис Борисович, помещик и сосед Раневской', ['Анна-Мария Константинопольская-Воронцова']],
        ['Аня', ['Ману']],
        ['Епиходов Семён Пантелеевич, конторщик', ['Владислав Мазуркевич-Преображенский']],
        ['Му-гун, правитель царства Цинь, гегемон', ['Александр Марин']],
      ],
      rotating: true,
    };
    PEOPLE.push(
      { id: 'long', name: 'Анна-Мария Константинопольская-Воронцова', shows: ['sad', 'blok', 'diss', 'cv', 'akro'] },
      { id: 'vlad-long', name: 'Владислав Мазуркевич-Преображенский', shows: ['akro'] },
      { id: 'yan', name: 'Ян', shows: [] },
    );
    AFISHA.splice(0, AFISHA.length,
      { month: 'сентябрь 2026', events: [
        { date: '01.09', time: '11:30', wd: 'вт', show: 'worst', n: 0 },
        { date: '14.09', time: '19:00', wd: 'пн', show: 'akro', n: 1 },
        { date: '30.09', time: '23:45', wd: 'ср', show: 'diss' },
      ] },
      { month: 'октябрь 2026', events: [] },
    );
  }
  if (mode === 'empty') AFISHA.splice(0, AFISHA.length, { month: 'ноябрь 2026', events: [] });
  if (mode === 'one') AFISHA.splice(0, AFISHA.length, { month: 'ноябрь 2026', events: [AFISHA[0].events[0]] });

  // Переключатель внизу экрана: Демо / Худший случай / Пусто / Один
  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.createElement('nav');
    bar.className = 'devbar';
    bar.setAttribute('aria-label', 'Данные для проверки');
    bar.innerHTML = [['demo', 'Демо'], ['worst', 'Худший случай'], ['empty', 'Пусто'], ['one', 'Один']]
      .map(([k, t]) => {
        const q = new URLSearchParams(location.search);
        q.set('data', k);
        return `<a href="?${q}${location.hash}" aria-current="${k === mode}">${t}</a>`;
      }).join('');
    document.body.append(bar);
  });
})();
