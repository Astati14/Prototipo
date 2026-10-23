/* =========================================================
   Historia de las Infancias — main.js
   Índice:
   1. Utilidades
   2. Pestañas accesibles (reutilizable)
   3. Menú lateral / cajón móvil
   4. Pestañas principales + enlace por #hash
   5. Pestañas de la línea de tiempo
   ========================================================= */
(() => {
    'use strict';

    /* ---------- 1. UTILIDADES ---------- */
    const $  = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const prefersReducedMotion = () =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- 2. PESTAÑAS ACCESIBLES ----------
       Cada [role="tab"] apunta a su panel con aria-controls.
       Soporta clic, flechas, Inicio y Fin. */
    function createTabs(tablist, onChange) {
        const tabs = $$('[role="tab"]', tablist);

        function select(tab, { focus = false } = {}) {
            tabs.forEach((t) => {
                const isActive = t === tab;
                t.setAttribute('aria-selected', String(isActive));
                t.tabIndex = isActive ? 0 : -1;

                const panel = document.getElementById(t.getAttribute('aria-controls'));
                if (panel) panel.hidden = !isActive;
            });

            if (focus) tab.focus();
            if (onChange) onChange(tab);
        }

        tablist.addEventListener('click', (e) => {
            const tab = e.target.closest('[role="tab"]');
            if (tab && tabs.includes(tab)) select(tab);
        });

        tablist.addEventListener('keydown', (e) => {
            const i = tabs.indexOf(document.activeElement);
            if (i === -1) return;

            let next;
            switch (e.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    next = tabs[(i + 1) % tabs.length];
                    break;
                case 'ArrowUp':
                case 'ArrowLeft':
                    next = tabs[(i - 1 + tabs.length) % tabs.length];
                    break;
                case 'Home':
                    next = tabs[0];
                    break;
                case 'End':
                    next = tabs[tabs.length - 1];
                    break;
                default:
                    return;
            }
            e.preventDefault();
            select(next, { focus: true });
        });

        return { tabs, select };
    }

    /* ---------- 3. MENÚ LATERAL / CAJÓN MÓVIL ---------- */
    const sidebar    = $('#nav-menu');
    const scrim      = $('#scrim');
    const menuToggle = $('#menu-toggle');
    const desktop    = window.matchMedia('(min-width: 1024px)');

    function setMenu(open) {
        sidebar.classList.toggle('is-open', open);
        scrim.classList.toggle('is-visible', open);
        document.body.classList.toggle('menu-open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
    }

    const isMenuOpen = () => sidebar.classList.contains('is-open');

    /* ---------- 4. PESTAÑAS PRINCIPALES ---------- */
    const main = createTabs($('#main-tablist'), (tab) => {
        const id = tab.getAttribute('aria-controls');

        // Enlace compartible y botón "atrás" del navegador (sin salto de scroll)
        if (location.hash !== `#${id}`) {
            history.pushState(null, '', `#${id}`);
        }

        if (isMenuOpen()) {
            setMenu(false);
            menuToggle.focus({ preventScroll: true });
        }

        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });

    const tabFromHash = () => {
        const id = decodeURIComponent(location.hash.slice(1));
        return main.tabs.find((t) => t.getAttribute('aria-controls') === id);
    };

    menuToggle.addEventListener('click', () => {
        const open = !isMenuOpen();
        setMenu(open);
        if (open) {
            const current = main.tabs.find((t) => t.getAttribute('aria-selected') === 'true');
            if (current) current.focus({ preventScroll: true });
        }
    });

    scrim.addEventListener('click', () => setMenu(false));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMenuOpen()) {
            setMenu(false);
            menuToggle.focus();
        }
    });

    desktop.addEventListener('change', (e) => {
        if (e.matches) setMenu(false);
    });

    window.addEventListener('hashchange', () => {
        const tab = tabFromHash();
        if (tab) main.select(tab);
    });

    // Si la URL trae #seccion (por ejemplo, #referencias), se abre esa pestaña
    const initialTab = tabFromHash();
    if (initialTab) main.select(initialTab);

    /* ---------- 5. PESTAÑAS DE LA LÍNEA DE TIEMPO ---------- */
    const timelineList = $('#timeline-tablist');
    if (timelineList) createTabs(timelineList);
})();
