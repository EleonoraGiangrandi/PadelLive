(function ($) {
    'use strict';

    const ENDPOINTS = {
        SEARCH: '/wp-json/fip/v1/player/search',
        RANKING: FipRanking.rankingApi,
        RACE: FipRanking.raceApi
    };

    function buildPlayerRow(p, type = 'ranking') {
        let moveHtml = '';
        const move = parseInt(type === 'ranking' ? p.move : p.race_move);
        if (move > 0) {
            moveHtml = `<span class="rank__green">+${move}</span>`;
        } else if (move < 0) {
            moveHtml = `<span class="rank__red">-${Math.abs(move)}</span>`;
        } else {
            moveHtml = `<span class=""></span>`;
        }

        const playerImg = p.thumbnail
            ? `<img class="image" src="${p.thumbnail}" alt="${FipRanking.i18n.photoOf} ${p.name}">`
            : `<img class="image image--placeholder" src="${FipRanking.templateURL}/assets/img/placeholder-table.png" alt="${FipRanking.i18n.placeholder}">`;

        const flagImg = p.country_flag
            ? `<img class="player__flag" src="${p.country_flag}" alt="${FipRanking.i18n.flagOf} ${p.country_name}" width="28" height="28" />`
            : '';

        const fullName = p.surname ? `${p.name} ${p.surname}` : p.name;
        // Il parametro ranking è già incluso in p.url dall'API
        let rank = p.rank == 9999 ? '' : p.rank;
        return `
        <tr class="table__row" style="display:none;">
            <td class="table__cell cell__rank">
                ${moveHtml}
                ${type === 'ranking' ? rank : p.race_rank}
            </td>
            <td class="table__cell cell__player">
                <div class="cell__playerWrap">
                    ${playerImg}
                    <a class="name" href="${p.url}">${fullName}</a>
                </div>
            </td>
            <td class="table__cell cell__country">
                <div class="cell__nation">
                    ${flagImg}
                    <p class="player__country">${p.country_name}</p>
                </div>
            </td>
            <td class="table__cell cell__points">
                <span>${type === 'ranking' ? p.points : p.race_points}</span>
            </td>
        </tr>`;
    }

    /**
     * Controlla se una colonna ha un filtro country attivo.
     */
    function isColumnFiltering($col, $container) {
        // Preferisci il filtro memorizzato sulla colonna (sorgente di verità, vedi
        // fetchColumnData): il select gemello select2 può avere .val() vuoto.
        const stored = $col.data('country-filter');
        if (stored !== undefined && stored !== null) {
            return !!(stored && stored !== '');
        }
        let $country = $col.find('.country__select');
        if (!$country.length) {
            const g = $col.data('gender');
            const cls = g === 'male' ? '.filter__male' : '.filter__female';
            $country = $container.find('.ranking__head ' + cls + ' .country__select').first();
        }
        const val = $country.length ? $country.val() : '';
        return !!(val && val !== '');
    }

    /**
     * Gestione centralizzata visibilità bottoni dopo fetch.
     * Valuta entrambe le colonne e decide globale vs singoli.
     */
    function resolveButtons($container) {
        const ctx = $container.data('btn-context');
        if (!ctx) return;

        const { $columns, $desktopBtn } = ctx;
        if (!$columns.length || !$desktopBtn.length) return;

        let filteringCount = 0;
        let notFinishedCount = 0;
        const colStates = [];

        $columns.each(function () {
            const $col = $(this);
            const state = $col.data('ranking-state') || {};
            const filtering = isColumnFiltering($col, $container);
            const finished = !!state.finished;
            if (filtering) filteringCount++;
            if (!finished) notFinishedCount++;
            colStates.push({ $col, filtering, finished, $btn: $col.find('.load__more.mobile') });
        });

        if (filteringCount === 0) {
            // Nessun filtro → comportamento sync: globale se ci sono risultati
            if (notFinishedCount > 0) {
                if (window.innerWidth >= 992) {
                    $desktopBtn.show();
                }
                colStates.forEach(c => c.$btn.removeClass('force-visible'));
            } else {
                $desktopBtn.hide();
                colStates.forEach(c => { c.$btn.hide(); c.$btn.removeClass('force-visible'); });
            }
        } else if (filteringCount === $columns.length) {
            // Tutte filtrate
            if (notFinishedCount === $columns.length) {
                // Entrambe non finite → globale visibile, singoli nascosti
                if (window.innerWidth >= 992) {
                    $desktopBtn.show();
                }
                colStates.forEach(c => c.$btn.removeClass('force-visible'));
            } else {
                // Almeno una finita → globale nascosto, singoli per le non finite
                $desktopBtn.hide();
                colStates.forEach(c => {
                    if (!c.finished) {
                        c.$btn.addClass('force-visible');
                    } else {
                        c.$btn.hide();
                        c.$btn.removeClass('force-visible');
                    }
                });
            }
        } else {
            // Solo alcune filtrate → colonne in stati diversi, globale non ha senso
            $desktopBtn.hide();
            colStates.forEach(c => {
                if (!c.finished) {
                    c.$btn.addClass('force-visible');
                } else {
                    c.$btn.hide();
                    c.$btn.removeClass('force-visible');
                }
            });
        }
    }

    /**
     * @param {jQuery} $col - L'oggetto colonna
     * @param {boolean} resetList - Se true, svuota la lista (nuova ricerca)
     * @param {boolean} isSyncCall - TRUE se chiamato dal bottone desktop centrale, FALSE se chiamato da filtri o bottone singolo
     */
    function fetchColumnData($col, resetList = false, isSyncCall = false, countryOverride = null) {
        const $tableBody = $col.find('.table__body');
        const $inputSearch = $col.find('.playersTable__search');
        const $mobileBtn = $col.find('.load__more.mobile');

        // Country select: cerca prima dentro $col (junior), poi nel ranking__head corrispondente (ranking)
        let $selectCountry = $col.find('.country__select');
        if (!$selectCountry.length) {
            const colGender = $col.data('gender');
            const filterCls = colGender === 'male' ? '.filter__male' : '.filter__female';
            $selectCountry = $col.closest('.ranking__container')
                .find('.ranking__head ' + filterCls + ' .country__select').first();
        }

        // Inizializza stato
        let currentState = $col.data('ranking-state') || {
            offset: parseInt($mobileBtn.data('offset')) || 5,
            limit: 20,
            loading: false,
            finished: false
        };

        if (currentState.loading || (currentState.finished && !resetList)) return;

        currentState.loading = true;

        if (resetList) {
            currentState.offset = 0;
            currentState.finished = false;
        }

        // Salva stato
        $col.data('ranking-state', currentState);

        // UI Loading
        if ($mobileBtn.is(':visible')) {
            $mobileBtn.addClass('loading').text(FipRanking.i18n.loading);
        }

        // Parametri API — fallback a data attributes del bottone se non c'è search input nella colonna
        const gender = $col.data('gender');
        const category = $inputSearch.length ? $inputSearch.data('category') : ($mobileBtn.data('category') || '');
        const circuit = $inputSearch.length ? $inputSearch.data('circuit') : ($mobileBtn.data('circuit') || '');
        const year = $mobileBtn.data('year');
        const weekNo = $mobileBtn.data('week-no');
        const searchQuery = $inputSearch.length ? $inputSearch.val().trim() : '';
        // Paese attivo: priorità all'override esplicito, poi al filtro memorizzato sulla
        // colonna (impostato dal listener degli header — sorgente di verità), infine al
        // valore del select come fallback. Evita che load-more legga un select gemello
        // vuoto (select2 AJAX non ha l'<option> non cercata lì) e ricada sull'endpoint
        // ranking perdendo il filtro.
        const storedCountry = $col.data('country-filter');
        const countryVal = countryOverride !== null
            ? countryOverride
            : (storedCountry !== undefined && storedCountry !== null
                ? storedCountry
                : ($selectCountry.length ? $selectCountry.val() : ''));

        // Determina endpoint
        const isFiltering = (searchQuery.length > 2 || (countryVal && countryVal !== ''));
        let url = isFiltering ? ENDPOINTS.SEARCH : ENDPOINTS.RANKING;

        // se cancello la ricerca l'offset non deve piu essere 0 ma 10 ma non deve andare a 10 se non c'è la ricerca
        if (resetList && !isFiltering && category == 'master') {
            currentState.offset = 10;
        }

        if (resetList && !isFiltering && category !== 'master' || category !== 'master') {
            currentState.limit = 5;
        }

        // Salva stato
        $col.data('ranking-state', currentState);

        // Parametri API
        let data = {
            limit: currentState.limit,
            offset: currentState.offset,
            gender: gender,
            category: category,
            circuit: circuit,
            year: year,
            week: weekNo,
            lang: FipRanking.lang || 'en'
        };

        if (isFiltering) {
            data.q = searchQuery;
            data.country = countryVal;
        }

        // AJAX
        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'json',
            data: data,
            success: function (response) {
                const players = response.error ? [] : response;

                if (resetList) {
                    $tableBody.empty();
                }

                if (players.length > 0) {
                    let html = '';
                    players.forEach(p => html += buildPlayerRow(p));

                    const $rows = $(html);
                    $tableBody.append($rows);
                    $rows.fadeIn();

                    currentState.offset += currentState.limit;
                    $col.data('ranking-state', currentState);
                }

                // --- GESTIONE STATO FINISHED ---
                if (players.length < currentState.limit || response.error) {
                    currentState.finished = true;

                    if (resetList && players.length === 0) {
                        $tableBody.html('<tr><td colspan="4" style="text-align:center; padding:20px;">' + FipRanking.i18n.noPlayersFound + '</td></tr>');
                    }
                }
            },
            error: function () {
                currentState.loading = false;
                $col.data('ranking-state', currentState);
            },
            complete: function () {
                currentState.loading = false;
                $col.data('ranking-state', currentState);

                $mobileBtn.removeClass('loading').text(FipRanking.i18n.loadMore);

                // Ricalcola visibilità bottoni per tutto il container
                resolveButtons($col.closest('.ranking__container'));

                $col.trigger('ranking:loaded');
            }
        });
    }

    /* ------------------------------------------------------------------ *
     * FIP Race — load more
     *
     * La Race nasceva tappata a 100 posizioni, stampate tutte nel markup e
     * solo nascoste via CSS: il bottone scopriva righe già presenti e finiva
     * lì. Ora il template ne stampa un primo blocco e da lì in poi si pagina
     * sull'API, come fa il ranking. Il bottone quindi fa due cose in
     * sequenza: prima svela le righe locali rimaste, poi chiede le
     * successive a FipRanking.raceApi.
     * ------------------------------------------------------------------ */

    const RACE_DEFAULTS = { batchSize: 30, limit: 20, category: 'master', circuit: 'premierpadel' };

    function raceConfig() {
        return $.extend({}, RACE_DEFAULTS, window.FipRaceConfig || {});
    }

    function raceState($container) {
        let state = $container.data('race-state');
        if (!state) {
            const $btn = $container.find('.race-load-more.mobile');
            state = {
                offset: parseInt($btn.data('offset'), 10) || 0,
                loading: false,
                finished: false
            };
            $container.data('race-state', state);
        }
        return state;
    }

    /**
     * Etichetta originale del bottone, memorizzata al primo uso. Rileggerla da
     * .text() a ogni giro la corromperebbe: se il bottone sta già mostrando
     * "Loading..." verrebbe salvata quella.
     */
    function raceLabel($btn) {
        let label = $btn.data('race-label');
        if (label === undefined) {
            label = $btn.text();
            $btn.data('race-label', label);
        }
        return label;
    }

    function setRaceLoading($btn, on) {
        if (!$btn.length) return;

        // Va letta prima di toccare il testo, anche quando si accende: se la
        // prima lettura cadesse sul ripristino memorizzerebbe "Loading...".
        const label = raceLabel($btn);

        if (on) {
            $btn.addClass('loading')
                .attr('aria-busy', 'true')
                .text(FipRanking.i18n.loading);
        } else {
            $btn.removeClass('loading')
                .removeAttr('aria-busy')
                .text(label);
        }
    }

    /** true se una qualsiasi colonna della sezione ha una richiesta in volo. */
    function raceSectionBusy($section) {
        return $section.find('.container__race').toArray().some(function (el) {
            const state = $(el).data('race-state');
            return !!(state && state.loading);
        });
    }

    /** Scopre fino a `batchSize` righe già presenti nel DOM. */
    function revealRaceRows($container, batchSize) {
        $container.find('.table__race .race-row--hidden')
            .slice(0, batchSize)
            .removeClass('race-row--hidden');
    }

    /** true se il container ha ancora righe locali da scoprire o pagine da chiedere. */
    function raceHasMore($container) {
        if ($container.find('.table__race .race-row--hidden').length) return true;
        return !raceState($container).finished;
    }

    /**
     * Nasconde i bottoni esauriti con una classe, non con .hide(): `.load__more`
     * e `.load__more.mobile` si accendono a vicenda via media query, e un
     * display inline messo da jQuery le scavalcherebbe facendo comparire il
     * bottone mobile su desktop.
     */
    function toggleRaceButtons($section) {
        let anyLeft = false;

        $section.find('.container__race').each(function () {
            const $container = $(this);
            const hasMore = raceHasMore($container);
            if (hasMore) anyLeft = true;
            $container.find('.race-load-more.mobile').toggleClass('race-load-more--done', !hasMore);
        });

        $section.find('#race-load-more-global').toggleClass('race-load-more--done', !anyLeft);
    }

    /**
     * Chiede la pagina successiva all'API Race e la accoda alla tabella.
     * @returns {jQuery.jqXHR|null} null se non c'è nulla da chiedere.
     */
    function fetchRacePage($container) {
        const state = raceState($container);
        if (state.loading || state.finished) return null;

        const $btn = $container.find('.race-load-more.mobile');
        const $tableBody = $container.find('.table__race .table__body');
        if (!$tableBody.length) {
            state.finished = true;
            return null;
        }

        const cfg = raceConfig();
        state.loading = true;

        // Il feedback va su entrambi i bottoni: su desktop si clicca il
        // globale e quello mobile è nascosto dalla media query, quindi
        // segnalare solo il mobile equivale a non segnalare niente.
        const $section = $container.closest('.section__race');
        const $global = $section.find('#race-load-more-global');
        setRaceLoading($btn, true);
        setRaceLoading($global, true);

        return $.ajax({
            url: ENDPOINTS.RACE,
            method: 'GET',
            dataType: 'json',
            data: {
                // Il proxy WP costruisce /api/{querytype}/load-more: senza
                // querytype finirebbe sull'endpoint ranking.
                querytype: 'race',
                limit: cfg.limit,
                offset: state.offset,
                gender: $btn.data('gender') || $container.data('gender') || '',
                category: $btn.data('category') || cfg.category,
                circuit: $btn.data('circuit') || cfg.circuit,
                year: $btn.data('year'),
                week: $btn.data('week-no'),
                lang: FipRanking.lang || 'en'
            },
            success: function (response) {
                const players = (response && !response.error && response.length) ? response : [];

                if (players.length) {
                    let html = '';
                    players.forEach(p => html += buildPlayerRow(p, 'race'));
                    const $rows = $(html);
                    $tableBody.append($rows);
                    $rows.fadeIn();
                    state.offset += players.length;
                }

                // Pagina corta o vuota: non c'è altro da chiedere. Copre anche
                // il caso in cui l'API Race non sia ancora deployata (errore o
                // lista vuota), lasciando la pagina con le sole righe locali.
                if (players.length < cfg.limit) {
                    state.finished = true;
                }
            },
            error: function () {
                state.finished = true;
            },
            complete: function () {
                state.loading = false;
                setRaceLoading($btn, false);

                // Il globale pilota entrambe le colonne: si sblocca solo
                // quando anche l'altra ha finito, altrimenti tornerebbe
                // "Load More" con una richiesta ancora in volo.
                if (!raceSectionBusy($section)) {
                    setRaceLoading($global, false);
                }

                toggleRaceButtons($section);
            }
        });
    }

    /** Un click = un blocco: prima le righe locali, poi la pagina remota. */
    function advanceRace($container) {
        const cfg = raceConfig();
        if ($container.find('.table__race .race-row--hidden').length) {
            revealRaceRows($container, cfg.batchSize);
            toggleRaceButtons($container.closest('.section__race'));
            return null;
        }
        return fetchRacePage($container);
    }

    function initRaceLoadMore() {
        const $sections = $('.section__race').filter(function () {
            return $(this).find('.container__race').length > 0;
        });
        if (!$sections.length) return;

        $sections.each(function () {
            const $section = $(this);

            $section.find('.container__race .race-load-more.mobile').on('click', function (e) {
                e.preventDefault();
                advanceRace($(this).closest('.container__race'));
            });

            // Desktop: un solo bottone per entrambe le colonne.
            $section.find('#race-load-more-global').on('click', function (e) {
                e.preventDefault();
                $section.find('.container__race').each(function () {
                    advanceRace($(this));
                });
            });

            toggleRaceButtons($section);
        });
    }


    $(document).ready(function () {

        initRaceLoadMore();

        let $filterLink = $("#ul_macroCat li.current_page_item a");
        let $filterSubcat = $(".filter-subcat");
        const mediaQueryMobile = window.matchMedia('(max-width: 768px)');

        if ($filterLink.length) {
            // if (mediaQueryMobile.matches) {
            //     $filterLink.addClass('rotate');
            // }

            $filterLink.on('click', function (e) {
                e.preventDefault();
                if ($filterSubcat.length) {
                    $filterSubcat.toggle();
                    $filterLink.toggleClass('rotate');

                    var href = $(this).attr('href');
                    var target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        }

        $('.ranking__container').each(function () {
            const $container = $(this);
            const $desktopBtn = $container.children('.load__more').not('.mobile');
            const $columns = $container.find('.table__col');

            // Salva contesto per resolveButtons
            $container.data('btn-context', { $columns, $desktopBtn });

            // --- FUNZIONE PER DISACCOPPIARE (feedback immediato pre-fetch) ---
            const decoupleColumns = () => {
                // resolveButtons ricalcola dopo il fetch, ma nascondiamo subito il globale
                $desktopBtn.hide();
            };

            // CLICK BOTTONE DESKTOP (Sync)
            $desktopBtn.on('click', function (e) {
                if($(this).attr('id') == 'race-load-more-global'){
                    return;
                }
                e.preventDefault();
                let allFinished = true;
                $columns.each(function () {
                    const state = $(this).data('ranking-state');
                    if (!state || !state.finished) allFinished = false;
                });

                if (allFinished) {
                    $desktopBtn.hide();
                    return;
                }

                const originalText = $desktopBtn.text();
                $desktopBtn.addClass('loading').text(FipRanking.i18n.loading);

                let loadedCount = 0;
                $columns.each(function () {
                    fetchColumnData($(this), false, true);
                });

                $columns.one('ranking:loaded', function () {
                    loadedCount++;
                    if (loadedCount >= $columns.length) {
                        $desktopBtn.removeClass('loading').text(originalText);
                        // resolveButtons è già chiamato da fetchColumnData.complete
                    }
                });
            });

            //LOGICA COLONNE
            $columns.each(function () {
                const $col = $(this);
                const $mobileBtn = $col.find('.load__more.mobile');
                const $input = $col.find('.playersTable__search');
                const $select = $col.find('.country__select');
                let debounceTimer;

                $col.data('ranking-state', {
                    offset: parseInt($mobileBtn.data('offset')) || 3,
                    limit: 20,
                    loading: false,
                    finished: false
                });

                // Click Bottone Singolo
                $mobileBtn.on('click', function (e) {

                    e.preventDefault();
                    decoupleColumns();
                    // FALSE = Non è sync, forza visibilità bottone
                    fetchColumnData($col, false, false);
                });

                // Filtri
                $input.on('input search', function () {
                    const val = $(this).val().trim();
                    if (val.length > 0 && val.length <= 2) return;

                    decoupleColumns();

                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                        fetchColumnData($col, true, false); // FALSE = Non è sync
                    }, 300);
                });

                $select.on('change select2:select', function () {
                    decoupleColumns();
                    // Memorizza il filtro sulla colonna (coerenza con load-more, vedi
                    // fetchColumnData): vale per i template col select dentro la colonna.
                    $col.data('country-filter', $(this).val() || '');
                    fetchColumnData($col, true, false); // FALSE = Non è sync
                });
            });

        });

        // ricerca generica sulla top nav, devo generare un container dopo il contenitore .ranking__topNav per contenere i risultati
        const $globalContainer = $('<div class="ranking__globalSearch"></div>');
        const $globalTable = $(`
            <table class="table__ranking ranking__table--global">
                <thead>
                    <tr>
                        <th class="table__header">${FipRanking.i18n.rank}</th>
                        <th class="table__header">${FipRanking.i18n.player}</th>
                        <th class="table__header">${FipRanking.i18n.country}</th>
                        <th class="table__header">${FipRanking.i18n.points}</th>
                    </tr>
                </thead>
                <tbody class="table__body"></tbody>
            </table>
        `);
        $globalContainer.append($globalTable);
        let globalDebounceTimer;
        let currentAjaxRequest = null; // Memorizza la richiesta AJAX corrente
        let globalSearchState = {
            offset: 0,
            limit: 20,
            loading: false,
            finished: false
        };

        // Factory per creare contesti di ricerca indipendenti (Race double: uno per container)
        function createSearchContext() {
            const $wrap = $('<div class="ranking__globalSearch"></div>');
            const $table = $(`
                <table class="table__ranking ranking__table--global">
                    <thead>
                        <tr>
                            <th class="table__header">Rank</th>
                            <th class="table__header">Player</th>
                            <th class="table__header">Country</th>
                            <th class="table__header">Points</th>
                        </tr>
                    </thead>
                    <tbody class="table__body"></tbody>
                </table>
            `);
            $wrap.append($table);
            return {
                $wrap: $wrap,
                $table: $table,
                state: { offset: 0, limit: 20, loading: false, finished: false },
                ajaxRequest: null,
                debounceTimer: null
            };
        }

        // Recupera o crea il contesto di ricerca per uno specifico container race
        function getRaceContext($raceContainer) {
            let ctx = $raceContainer.data('search-ctx');
            if (!ctx) {
                ctx = createSearchContext();
                $raceContainer.data('search-ctx', ctx);
            }
            return ctx;
        }

        /**
         * @param {string} searchQuery - Testo di ricerca
         * @param {boolean} resetList - Se true, svuota la lista
         * @param {string} type - 'ranking' o 'race'
         * @param {jQuery|null} $sourceInput - L'input sorgente per scoping
         * @param {object|null} ctx - Contesto per-container (race). Se null, usa i globali (ranking)
         */
        function fetchGlobalSearchData(searchQuery, resetList = false, type = 'ranking', $sourceInput = null, ctx = null, countryOverride = null) {
            // Determina quale contesto usare (per-container race o globale ranking)
            const useCtx = ctx !== null;
            const searchState = useCtx ? ctx.state : globalSearchState;
            const $searchWrap = useCtx ? ctx.$wrap : $globalContainer;
            const $searchTable = useCtx ? ctx.$table : $globalTable;

            // Annulla la richiesta pendente per questo contesto
            if (useCtx) {
                if (ctx.ajaxRequest) { ctx.ajaxRequest.abort(); ctx.ajaxRequest = null; }
            } else {
                if (currentAjaxRequest) { currentAjaxRequest.abort(); currentAjaxRequest = null; }
            }

            const $topNav = $('.ranking__topNav');
            if (searchState.finished && !resetList) return;

            searchState.loading = true;

            if (resetList) {
                searchState.offset = 0;
                searchState.finished = false;
            }
            let $input;
            if ($sourceInput) {
                $input = $sourceInput;
            } else if (type == 'ranking') {
                $input = $topNav?.find('.playersTable__search');
            } else {
                $input = $('.playersTable__search').first();
            }
            const $tableBody = $searchTable.find('.table__body');

            const category = $input.data('category') || '';
            const circuit = $input.data('circuit') || '';
            const gender = $input.data('gender') || '';
            const $scopeContainer = $input.closest('.container__race');
            const $country = $scopeContainer.length
                ? $scopeContainer.find('.country__select')
                : $input.closest('.ranking__topNav').find('.country__select');
            const $loadMoreBtn = $('<button class="load__more load__more--global">' + FipRanking.i18n.loadMore + '</button>');

            const resolvedCountry = countryOverride !== null ? countryOverride : ($country.length ? $country.val() : '');

            const ajaxReq = $.ajax({
                url: ENDPOINTS.SEARCH,
                method: 'GET',
                dataType: 'json',
                data: {
                    q: searchQuery,
                    limit: searchState.limit,
                    offset: searchState.offset,
                    category: category,
                    circuit: circuit,
                    search_type: type,
                    country: resolvedCountry,
                    gender: gender,
                    lang: FipRanking.lang || 'en'
                },
                beforeSend: function () {
                    if (resetList) {
                        $tableBody.html('<tr><td colspan="4" style="text-align:center; padding:20px;">' + FipRanking.i18n.loading + '</td></tr>');
                    }
                },
                success: function (response) {
                    const players = response.error ? [] : response;

                    if (resetList) {
                        $tableBody.empty();
                    }

                    if (players.length > 0) {
                        let html = '';
                        players.forEach(p => html += buildPlayerRow(p, type));

                        const $rows = $(html);
                        $tableBody.append($rows);
                        $rows.fadeIn();
                        $searchWrap.find('.load__more--global').removeClass('loading').text(FipRanking.i18n.loadMore);

                        searchState.offset += searchState.limit;
                    }

                    if (players.length < searchState.limit || response.error) {
                        searchState.finished = true;
                        $searchWrap.find('.load__more--global').hide();

                        if (resetList && players.length === 0) {
                            $tableBody.html('<tr><td colspan="4" style="text-align:center; padding:20px;">' + FipRanking.i18n.noPlayersFound + '</td></tr>');
                        }
                    } else {
                        // Mostra/aggiungi bottone Load More se non esiste
                        if (!$searchWrap.find('.load__more--global').length) {
                            $searchWrap.append($loadMoreBtn);
                            $loadMoreBtn.on('click', function (e) {
                                e.preventDefault();
                                const currentQuery = $input.val().trim();
                                $loadMoreBtn.addClass('loading').text('Loading...');
                                fetchGlobalSearchData(currentQuery, false, type, $input, ctx);
                            });
                        }
                        $searchWrap.find('.load__more--global').show();
                    }
                },
                error: function (jqXHR, textStatus) {
                    // Non mostrare errore se la richiesta è stata annullata intenzionalmente
                    if (textStatus === 'abort') return;

                    searchState.loading = false;
                    $tableBody.html('<tr><td colspan="4" style="text-align:center; padding:20px;">' + FipRanking.i18n.errorLoading + '</td></tr>');
                },
                complete: function () {
                    searchState.loading = false;
                    if (useCtx) {
                        ctx.ajaxRequest = null;
                    } else {
                        currentAjaxRequest = null;
                    }
                }
            });

            // Salva il riferimento alla richiesta nel contesto corretto
            if (useCtx) {
                ctx.ajaxRequest = ajaxReq;
            } else {
                currentAjaxRequest = ajaxReq;
            }
        }

        // Funzione per raccogliere i dati e lanciare la ricerca
        function triggerSearch($inputElement) {
            const val = $inputElement.val().trim();

            // Identifica il contesto (Race o Ranking)
            const $parentRace = $inputElement.closest('.filter__race');
            const isPerContainerRace = $parentRace.length > 0;
            const rankingType = $inputElement.data('ranking-type') || 'ranking';
            const isRaceSearch = isPerContainerRace || rankingType === 'race';
            const type = isRaceSearch ? 'race' : 'ranking';

            if (isPerContainerRace) {
                // --- RACE: gestione indipendente per container ---
                const $raceContainer = $inputElement.closest('.container__race');
                const ctx = getRaceContext($raceContainer);
                const $normalContainer = $raceContainer.find('.table__race');
                const $anchor = $inputElement.closest('.filter__race');
                const countryVal = $parentRace.find('.country__select').val();

                // Annulla timer e richieste pendenti per QUESTO container
                clearTimeout(ctx.debounceTimer);
                if (ctx.ajaxRequest) {
                    ctx.ajaxRequest.abort();
                    ctx.ajaxRequest = null;
                }

                if (val.length === 0 && !countryVal) {
                    ctx.$wrap.detach();
                    $normalContainer.show();
                    ctx.state = { offset: 0, limit: 20, loading: false, finished: false };
                    return;
                }

                $normalContainer.hide();
                if (!$anchor.next().is(ctx.$wrap)) {
                    $anchor.after(ctx.$wrap);
                }
                ctx.$wrap.show();

                ctx.debounceTimer = setTimeout(() => {
                    fetchGlobalSearchData(val, true, type, $inputElement, ctx);
                }, 300);

            } else {
                // --- GLOBALE: ranking o race da topnav ---
                const $normalContainer = $('.ranking__container');
                const $anchor = $('.ranking__topNav');
                const countryVal = $inputElement.closest('.ranking__topNav').find('.country__select').val();

                clearTimeout(globalDebounceTimer);
                if (currentAjaxRequest) {
                    currentAjaxRequest.abort();
                    currentAjaxRequest = null;
                }

                if (val.length === 0 && !countryVal) {
                    $globalContainer.detach();
                    $normalContainer.show();
                    globalSearchState = { offset: 0, limit: 20, loading: false, finished: false };
                    return;
                }

                $normalContainer.hide();
                if (!$anchor.next().is($globalContainer)) {
                    $anchor.after($globalContainer);
                }
                $globalContainer.show();

                globalDebounceTimer = setTimeout(() => {
                    fetchGlobalSearchData(val, true, type, $inputElement);
                }, 300);
            }
        }

        // --- Event Listeners ---

        // Input testuale
        $('.ranking__topNav .playersTable__search, .filter__race .playersTable__search').on('input search', function () {
            const val = $(this).val().trim();
            // Se c'è del testo, aspettiamo i 3 caratteri, a meno che non vogliamo cercare solo per filtro
            if (val.length > 0 && val.length <= 2) return;

            triggerSearch($(this));
        });

        // Cambio Filtro Country (per-column race — solo dentro .container__race, non .ranking__head)
        $('.container__race .filter__race .country__select').on('change select2:select', function () {
            const $relatedInput = $(this).closest('.filter__race').find('.playersTable__search');
            if ($relatedInput.length) {
                triggerSearch($relatedInput);
            }
        });

        // Cambio Filtro Country (top nav — ranking e race-double)
        $('.ranking__topNav .country__select').on('change select2:select', function () {
            const $relatedInput = $(this).closest('.ranking__topNav').find('.playersTable__search');
            if ($relatedInput.length) {
                triggerSearch($relatedInput);
            }
        });

        // Cambio Filtro Country negli header race (ranking__head dentro ranking__race)
        $('.ranking__container.ranking__race > .ranking__head .country__select').on('change select2:select', function () {
            const $head = $(this).closest('.ranking__head');
            const $container = $head.closest('.ranking__container');
            const isMale = $head.find('.ranking__titleMale').length > 0;
            const raceClass = isMale ? '.race__male' : '.race__female';
            const $raceContainer = $container.find('.container__race' + raceClass);
            const countryVal = $(this).val();

            if (!$raceContainer.length) return;

            const ctx = getRaceContext($raceContainer);
            const $normalContainer = $raceContainer.find('.table__race');
            const $raceLoadMore = $raceContainer.find('.race-load-more.mobile');

            // Annulla pending
            clearTimeout(ctx.debounceTimer);
            if (ctx.ajaxRequest) { ctx.ajaxRequest.abort(); ctx.ajaxRequest = null; }

            if (!countryVal) {
                // Reset: mostra tabella originale, rimuovi risultati ricerca
                ctx.$wrap.detach();
                $normalContainer.show();
                $raceLoadMore.show();
                ctx.state = { offset: 0, limit: 20, loading: false, finished: false };
                return;
            }

            // Nascondi tabella originale, mostra wrapper ricerca
            $normalContainer.hide();
            $raceLoadMore.hide();
            if (!$raceContainer.find(ctx.$wrap).length) {
                $raceContainer.append(ctx.$wrap);
            }
            ctx.$wrap.show();

            // Usa input topNav come source per data-attributes (category, circuit, gender)
            const $topNavInput = $container.closest('.section__race').find('.ranking__topNav .playersTable__search');
            const gender = isMale ? 'male' : 'female';

            // Crea un input fittizio con i data attributes corretti se la topNav non ha gender
            let $srcInput = $topNavInput;
            if ($srcInput.length && !$srcInput.data('gender')) {
                $srcInput = $srcInput.clone().data('gender', gender);
            }

            fetchGlobalSearchData('', true, 'race', $srcInput, ctx, countryVal);
        });

        // Cambio Filtro Country negli header ranking (principali + --table, esclusi race)
        // Trova la table__col per gender e lancia fetchColumnData
        let countrySyncGuard = false;
        $('.ranking__head .country__select').on('change select2:select', function () {
            // Anti ri-entranza: la sincronizzazione desktop<->--table qui sotto emette
            // `change.select2`. Per le regole namespace di jQuery un handler senza
            // namespace (questo, su 'change') risponde anche a un trigger con namespace,
            // quindi senza guardia un cambio sul filtro maschile rilanciava fetch
            // incrociati e finiva per filtrare la colonna femminile.
            if (countrySyncGuard) return;

            // Skip se siamo in un container race (gestito dal listener dedicato sopra)
            if ($(this).closest('.ranking__container').hasClass('ranking__race')) return;
            const $head = $(this).closest('.ranking__head');
            const $container = $head.closest('.ranking__container');
            const isMale = $head.find('.ranking__titleMale').length > 0;
            const genderClass = isMale ? '.table__male' : '.table__female';
            const $col = $container.find('.table__col' + genderClass);

            if (!$col.length) return; // race e pagine senza table__col: no-op

            // Valore e genere derivano dal select toccato.
            const val = $(this).val();
            const filterCls = isMale ? '.filter__male' : '.filter__female';

            // Sorgente di verità del filtro per questa colonna: i select restano solo UI.
            // load-more e bottone globale rileggono questo dato, non i select (che in
            // select2 AJAX possono non avere l'<option> nel gemello sincronizzato).
            $col.data('country-filter', val || '');

            // Sincronizza i select gemelli dello stesso genere (cosmetico: stessa bandiera
            // quando diventano sticky). Cloniamo l'<option> selezionata così select2 può
            // mostrarla anche se mancava. Guardia attiva per non rilanciare questo handler.
            const $selectedOpt = $(this).find('option:selected');
            countrySyncGuard = true;
            $container.find('.ranking__head ' + filterCls + ' .country__select').not(this).each(function () {
                const $sib = $(this);
                if (val && $selectedOpt.length && !$sib.find('option[value="' + val + '"]').length) {
                    $sib.append($selectedOpt.clone());
                }
                $sib.val(val).trigger('change.select2');
            });
            countrySyncGuard = false;

            // Paese passato esplicitamente: la fetch non dipende da quale select .first()
            // risolve nel container (causa dello scambio maschi/femmine).
            fetchColumnData($col, true, false, val);
        });

    });

    // --- GESTIONE INDIPENDENTE DEI BOTTONI (FIXED) ---
    function handleBackToRowButtons() {
        // Solo Desktop
        if (window.innerWidth < 992) {
            $('.btn-back-to-last-row').hide();
            return;
        }

        // Recuperiamo l'header per calcolare l'offset (se hai un menu fisso, aumenta questo valore)
        const headerOffset = 140;
        const windowHeight = window.innerHeight;

        $('.table__col').each(function () {
            const $col = $(this);
            const $table = $col.find('.table__ranking');
            const $btn = $col.find('.btn-back-to-last-row');

            // Se mancano elementi, salta
            if ($table.length === 0 || $btn.length === 0) return;

            // Rettangoli della tabella e del CONTENITORE PADRE (la riga completa)
            // Usiamo il parent() perché se la colonna è corta, il suo rect finisce subito.
            // Il parent invece si estende per l'altezza della colonna più lunga.
            const tableRect = $table[0].getBoundingClientRect();
            const parentRect = $col.parent()[0].getBoundingClientRect();

            // CONDIZIONE 1: La tabella è "finita" e uscita verso l'alto?
            // (Il fondo della tabella è più in alto dell'header)
            const isTableScrolledPast = tableRect.bottom < headerOffset;

            // CONDIZIONE 2: La sezione generale è ancora visibile?
            // (Il fondo del contenitore generale è ancora sotto il fondo dello schermo)
            // Aggiungiamo un piccolo margine (es. 100px) per nasconderlo poco prima del footer
            const isSectionStillVisible = parentRect.bottom > (windowHeight - 50);

            if (isTableScrolledPast && isSectionStillVisible) {
                // Calcoli per centrare il bottone nella colonna
                const colRect = $col[0].getBoundingClientRect();
                const btnWidth = $btn.outerWidth() || 160;

                // Centra rispetto alla colonna specifica
                const leftPos = colRect.left + (colRect.width / 2) - (btnWidth / 2);

                $btn.css({
                    'display': 'flex',
                    'left': leftPos + 'px'
                });
            } else {
                $btn.hide();
            }
        });
    }

    // Listener
    $(window).on('scroll resize', function () {
        handleBackToRowButtons();
    });

    // Click handler
    $(document).on('click', '.btn-back-to-last-row', function (e) {
        e.preventDefault();
        const $col = $(this).closest('.table__col');
        const $table = $col.find('.table__ranking');

        // Trova l'ultima riga visibile
        const $lastRow = $table.find('tr').filter(':visible').last();

        if ($lastRow.length > 0) {
            $('html, body').animate({
                scrollTop: $lastRow.offset().top - (window.innerHeight / 2)
            }, 500);
        }
    });

    // Avvio immediato per check iniziale
    setTimeout(handleBackToRowButtons, 100);

})(jQuery);

document.addEventListener('DOMContentLoaded', () => {
    const sentinelTopNav = document.getElementById('sticky-sentinel');
    const stickyTopNav = document.getElementById('sticky-topNav');

    const observerTopNav = new IntersectionObserver(
        ([entry]) => {
            stickyTopNav.classList.toggle('is-stuck', !entry.isIntersecting);
        },
        { threshold: 0 }
    );

    if (sentinelTopNav) {
        observerTopNav.observe(sentinelTopNav);
    }

    // Desktop: mostra filtri country negli header quando la tabella è vicina allo sticky header
    const firstTableCol = document.querySelector('.table__col.next__20');
    const stickyRankingHead = document.querySelectorAll('.ranking__head:not(.ranking__head--table)');

    if (firstTableCol && stickyRankingHead.length) {
        let hasScrolled = false;
        window.addEventListener('scroll', () => { hasScrolled = true; }, { once: true });

        const observerRankHead = new IntersectionObserver(
            ([entry]) => {
                if (!hasScrolled) return;
                // Filtro visibile quando la tabella è nel viewport (vicina allo sticky header)
                stickyRankingHead.forEach((el) => {
                    el.classList.toggle('is-stuck', entry.isIntersecting);
                });
            },
            // rootMargin -170px top = la tabella deve essere a ~170px dal top (zona dello sticky)
            { threshold: 0, rootMargin: '-170px 0px 0px 0px' }
        );

        observerRankHead.observe(firstTableCol);
    }
});
