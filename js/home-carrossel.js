import { TAGS, categoriasDoProjeto, tagsDoProjeto } from './tags.js';

const carrosselStates = {
    'carrossel-dg': 0
};

let isDragging = false;
let startX = 0;
let startY = 0;
let currentTrackId = null;
let foiArrastado = false;

window.moveCarrossel = moveCarrossel;

async function carregarCarrosseis() {
    try {
        const response = await fetch('./dados-projetos.json');
        const projetos = await response.json();

        renderizarCards(projetos, 'designs', 'carrossel-dg');

        configurarFiltros(projetos);
        desativarCategoriasVazias(projetos);

        configurarDrag('carrossel-dg');

        configurarHoverSincronizado('carrossel-dg');

        configurarAutoplay('carrossel-dg');
    } catch (e) {
        console.error("Erro ao carregar os projetos:", e);
    }
}

// Embaralha uma lista (Fisher-Yates) sem alterar a original
function embaralhar(lista) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
        const k = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[k]] = [copia[k], copia[i]];
    }
    return copia;
}

function renderizarCards(dados, categoria, elementId, filtro = 'all') {
    const container = document.getElementById(elementId);
    if (!container) return;

    // 1. Filtra pelo tipo e, se houver, pela categoria escolhida.
    //    O carrossel de peças também traz os sites (categoria "site").
    //    O filtro olha TODOS os projetos, não só os 10 que já estavam na tela.
    const tipos = categoria === 'designs' ? ['designs', 'websites'] : [categoria];
    const filtrados = dados.filter(p =>
        tipos.includes(p.tipo) &&
        (filtro === 'all' || categoriasDoProjeto(p).includes(filtro))
    );

    // 2. Sorteia a ordem (embaralha) e limita a no máximo 10 itens.
    //    Cada vez que a página carrega ou uma categoria é clicada, o sorteio muda.
    const limitados = embaralhar(filtrados).slice(0, 10);

    // 3. Renderiza apenas os 10 sorteados
    container.innerHTML = limitados.map((p, index) => `
        <div class="card-projeto-home" data-index="${index}">
            <a href="projeto-${p.tipo}.html?id=${p.id}" class="card-content" draggable="false">
                <div class="thumb-wrapper">
                    <img src="${p.thumb}" alt="${p.titulo}" draggable="false">
                </div>
                <div class="card-text">
                    <h3>${p.titulo}</h3>
                    ${tagsHtml(p)}
                </div>
            </a>
        </div>
    `).join('');

    setTimeout(() => {
        atualizarEstadoVisual(elementId);
    }, 50);
}

// Tags do card (clicar leva para a página Peças já filtrada por essa tag)
function tagsHtml(projeto) {
    const ids = tagsDoProjeto(projeto);
    if (!ids.length) return '';
    return `<div class="card-tags">${ids.map(id =>
        `<span class="tag-chip-home" data-tag="${id}">${TAGS.find(t => t.id === id).label}</span>`
    ).join('')}</div>`;
}

// Categoria sem nenhuma peça: fica com 20% de opacidade e sem clique (igual à página Peças)
function desativarCategoriasVazias(projetos) {
    document.querySelectorAll('.filtros-home[data-tipo="designs"] .btn-filtro').forEach(btn => {
        const filtro = btn.getAttribute('data-filter');
        if (filtro === 'all') return;
        const existe = projetos.some(p =>
            (p.tipo === 'designs' || p.tipo === 'websites') && categoriasDoProjeto(p).includes(filtro)
        );
        btn.disabled = !existe;
    });
}

function moveCarrossel(id, direcao) {
    const track = document.getElementById(id);
    if (!track) return;

    track.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';

    const isMobile = window.innerWidth < 768;
    const cardsPorVez = isMobile ? 1 : 2;
    carrosselStates[id] += direcao;
    const totalCards = track.querySelectorAll('.card-projeto-home').length;
    const maxIndex = Math.max(0, totalCards - cardsPorVez);

    if (carrosselStates[id] < 0) carrosselStates[id] = 0;
    if (carrosselStates[id] > maxIndex) carrosselStates[id] = maxIndex;

    const card = track.querySelector('.card-projeto-home');
    if (card) {
        const cardWidth = card.offsetWidth;
        const gap = 30;
        const moveX = carrosselStates[id] * (cardWidth + gap);
        track.style.transform = `translateX(${-moveX}px)`;
    }
    atualizarEstadoVisual(id);
}

function atualizarEstadoVisual(id) {
    const track = document.getElementById(id);
    if (!track) return;
    const cards = track.querySelectorAll('.card-projeto-home');
    const isMobile = window.innerWidth < 768;
    const qtdAtiva = isMobile ? 1 : 2;
    const currentIndex = carrosselStates[id];

    cards.forEach((card, i) => {
        card.classList.remove('active', 'force-hover');
        if (i >= currentIndex && i < currentIndex + qtdAtiva) {
            card.classList.add('active');
        }
    });

    const prevBtn = document.querySelector(`.nav-home.prev[onclick*="${id}"]`);
    const nextBtn = document.querySelector(`.nav-home.next[onclick*="${id}"]`);

    if (prevBtn) {
        prevBtn.style.display = currentIndex <= 0 ? 'none' : 'flex';
        prevBtn.classList.remove('force-hover');
    }
    if (nextBtn) {
        const maxIndex = Math.max(0, cards.length - qtdAtiva);
        nextBtn.style.display = currentIndex >= maxIndex ? 'none' : 'flex';
        nextBtn.classList.remove('force-hover');
    }
}

// --- CATEGORIAS (botões acima de cada carrossel da home) ---
const temporizadoresFiltro = {};

function configurarFiltros(projetos) {
    document.querySelectorAll('.filtros-home').forEach(grupo => {
        const id = grupo.getAttribute('data-carrossel');
        const tipo = grupo.getAttribute('data-tipo');

        grupo.querySelectorAll('.btn-filtro').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('active')) return;
                grupo.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                trocarCategoria(projetos, tipo, id, btn.getAttribute('data-filter'));
            });
        });
    });
}

function trocarCategoria(projetos, tipo, id, filtro) {
    const track = document.getElementById(id);
    const mask = track ? track.parentElement : null;
    if (!track || !mask) return;

    // Some em 0.2s, troca os cards e volta a aparecer em 0.3s (ver portfolio.css)
    clearTimeout(temporizadoresFiltro[id]);
    mask.classList.add('is-filtrando');

    temporizadoresFiltro[id] = setTimeout(() => {
        carrosselStates[id] = 0;
        track.style.transition = 'none';
        track.style.transform = 'translateX(0px)';

        renderizarCards(projetos, tipo, id, filtro);

        requestAnimationFrame(() => mask.classList.remove('is-filtrando'));
    }, 200);
}

function configurarHoverSincronizado(id) {
    const track = document.getElementById(id);
    const prevBtn = document.querySelector(`.nav-home.prev[onclick*="${id}"]`);
    const nextBtn = document.querySelector(`.nav-home.next[onclick*="${id}"]`);

    const toggle = (direcao, ligar) => {
        const isMobile = window.innerWidth < 768;
        const index = carrosselStates[id];
        const targetIdx = (direcao === 'next') ? index + (isMobile ? 1 : 2) : index - 1;
        const card = track.querySelector(`.card-projeto-home[data-index="${targetIdx}"]`);
        const btn = (direcao === 'next') ? nextBtn : prevBtn;

        if (ligar) {
            if (btn) btn.classList.add('force-hover');
            if (card) card.classList.add('force-hover');
        } else {
            if (btn) btn.classList.remove('force-hover');
            if (card) card.classList.remove('force-hover');
        }
    };

    if (nextBtn) {
        nextBtn.addEventListener('mouseenter', () => toggle('next', true));
        nextBtn.addEventListener('mouseleave', () => toggle('next', false));
    }
    if (prevBtn) {
        prevBtn.addEventListener('mouseenter', () => toggle('prev', true));
        prevBtn.addEventListener('mouseleave', () => toggle('prev', false));
    }

    track.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.card-projeto-home');
        if (card && !card.classList.contains('active')) {
            const idx = parseInt(card.getAttribute('data-index'));
            toggle(idx > carrosselStates[id] ? 'next' : 'prev', true);
        }
    });

    track.addEventListener('mouseout', () => {
        if (nextBtn) nextBtn.classList.remove('force-hover');
        if (prevBtn) prevBtn.classList.remove('force-hover');
        track.querySelectorAll('.card-projeto-home').forEach(c => c.classList.remove('force-hover'));
    });
}

function configurarDrag(id) {
    const track = document.getElementById(id);
    const mask = track.parentElement;

    const iniciarArrasto = (e) => {
        if (e.target.closest('.nav-home')) return;
        isDragging = true;
        currentTrackId = id;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        startY = e.type.includes('mouse') ? e.pageY : e.touches[0].clientY;
        track.style.transition = 'none';
        foiArrastado = false;
        mask.classList.add('is-dragging');
    };

    const duranteArrasto = (e) => {
        if (!isDragging || currentTrackId !== id) return;
        const x = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const walkX = x - startX;

        if (Math.abs(walkX) > 5) {
            if (e.cancelable) e.preventDefault();
            foiArrastado = true;
            const cardWidth = track.querySelector('.card-projeto-home').offsetWidth;
            const gap = 30;
            const currentMove = carrosselStates[id] * (cardWidth + gap);
            let finalMove = currentMove - walkX;
            track.style.transform = `translateX(${-finalMove}px)`;
        }
    };

    const finalizarArrasto = (e) => {
        if (!isDragging || currentTrackId !== id) return;
        isDragging = false;
        mask.classList.remove('is-dragging');
        track.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
        if (foiArrastado) {
            const endX = e.type.includes('mouse') ? e.pageX : (e.changedTouches ? e.changedTouches[0].clientX : startX);
            const diff = startX - endX;
            if (diff > 50) moveCarrossel(id, 1);
            else if (diff < -50) moveCarrossel(id, -1);
            else moveCarrossel(id, 0);
        }
        setTimeout(() => { foiArrastado = false; currentTrackId = null; }, 50);
    };

    mask.addEventListener('mousedown', iniciarArrasto);
    window.addEventListener('mousemove', duranteArrasto);
    window.addEventListener('mouseup', finalizarArrasto);
    mask.addEventListener('touchstart', iniciarArrasto, { passive: true });
    window.addEventListener('touchmove', duranteArrasto, { passive: false });
    window.addEventListener('touchend', finalizarArrasto);

    track.addEventListener('click', (e) => {
        if (foiArrastado) { e.preventDefault(); return; }
        const card = e.target.closest('.card-projeto-home');

        // Clique numa tag de um card ativo: abre a página Peças filtrada por ela
        const tag = e.target.closest('.tag-chip-home');
        if (tag && card && card.classList.contains('active')) {
            e.preventDefault();
            window.location.href = 'pecas.html?tag=' + encodeURIComponent(tag.getAttribute('data-tag'));
            return;
        }

        if (card && !card.classList.contains('active')) {
            e.preventDefault();
            const clickedIndex = parseInt(card.getAttribute('data-index'));
            moveCarrossel(id, clickedIndex > carrosselStates[id] ? 1 : -1);
        }
    });
}

// --- AUTOPLAY: avança 1 slide a cada 2 segundos, como clicar na seta da direita ---
// Pausa com o mouse em cima do carrossel (cards e setas), enquanto arrasta/toca
// e com a aba em segundo plano. Ao chegar no último slide, volta para o primeiro.
const INTERVALO_AUTOPLAY = 2000;

function configurarAutoplay(id) {
    const track = document.getElementById(id);
    const wrapper = track ? track.closest('.wrapper-carrossel-home') : null;
    if (!track || !wrapper) return;

    // Quem pediu menos movimento no sistema fica sem autoplay
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer = null;
    let pausado = false;

    const avancar = () => {
        if (pausado || isDragging) return;
        const cardsPorVez = window.innerWidth < 768 ? 1 : 2;
        const total = track.querySelectorAll('.card-projeto-home').length;
        const maxIndex = Math.max(0, total - cardsPorVez);
        if (maxIndex === 0) return;

        if (carrosselStates[id] >= maxIndex) {
            moveCarrossel(id, -carrosselStates[id]); // chegou no fim: volta ao começo
        } else {
            moveCarrossel(id, 1);
        }
    };

    const iniciar = () => {
        clearInterval(timer);
        if (pausado) return;
        timer = setInterval(avancar, INTERVALO_AUTOPLAY);
    };

    const pausar = () => {
        pausado = true;
        clearInterval(timer);
    };

    const retomar = () => {
        if (wrapper.matches(':hover')) return; // mouse ainda em cima: continua pausado
        pausado = false;
        iniciar(); // recomeça a contagem dos 2 segundos
    };

    // Mouse em cima do carrossel (peças e setas): pausa
    wrapper.addEventListener('mouseenter', pausar);
    wrapper.addEventListener('mouseleave', retomar);

    // Celular: pausa enquanto o dedo está na tela
    wrapper.addEventListener('touchstart', pausar, { passive: true });
    wrapper.addEventListener('touchend', retomar);
    wrapper.addEventListener('touchcancel', retomar);

    // Aba em segundo plano: pausa
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) pausar(); else retomar();
    });

    iniciar();
}

carregarCarrosseis();

window.addEventListener('resize', () => {
    moveCarrossel('carrossel-dg', 0);
});