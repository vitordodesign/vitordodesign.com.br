/* ==========================================================
   PEÇAS - lista com filtro por categoria + filtro por tag
   - Mostra projetos do tipo "designs" e "websites".
   - Todo projeto "websites" entra na categoria "site" (isolada,
     igual ao Logo). O formato de visualização continua o do
     projeto-websites.html (imagem longa com scroll).
   - Tags: dá para escolher várias (o card precisa ter todas). Vêm do campo "tags" do JSON e também do campo
     "tecnologias" (quando o nome bate com uma tag da lista).
   ========================================================== */

import { TAGS, TAG_POR_CHAVE, chave, categoriasDoProjeto, tagsDoProjeto } from './tags.js';

// Estado atual dos filtros
let categoriaAtiva = 'all';
let tagsAtivas = [];   // tags escolhidas (o card precisa ter TODAS)
let barraTags = null;  // caixa com as tags escolhidas, embaixo das categorias

let cards = [];      // [{ el, categorias, tags }]
let grid = null;
let botoesCategoria = [];
let temporizador = null;

async function carregarProjetos() {
    const response = await fetch('./dados-projetos.json');
    return response.json();
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

function renderizarCards(projetos, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Sorteia a ordem a cada carregamento da página (igual ao carrossel da home).
    // O sorteio acontece uma vez só: ao filtrar, a ordem sorteada se mantém.
    const lista = embaralhar(
        projetos
            .filter(p => p.tipo === 'designs' || p.tipo === 'websites')
            .map(p => ({ projeto: p, categorias: categoriasDoProjeto(p), tags: tagsDoProjeto(p) }))
    );

    container.innerHTML = lista.map(({ projeto, categorias, tags }) => `
        <div class="card-projeto" data-categoria='${JSON.stringify(categorias)}' data-tags='${JSON.stringify(tags)}'>
            <div class="card-content">
                <div class="thumb-wrapper">
                    <img src="${projeto.thumb}" alt="${projeto.titulo}">
                </div>
                <div class="card-text">
                    <h3><a href="projeto-${projeto.tipo}.html?id=${projeto.id}" class="card-link">${projeto.titulo}</a></h3>
                    ${tags.length ? `
                    <div class="card-tags">
                        ${tags.map(id => {
        const tag = TAGS.find(t => t.id === id);
        return `<button type="button" class="tag-chip" data-tag="${id}" aria-pressed="false">${tag.label}</button>`;
    }).join('')}
                    </div>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    grid = container;
    cards = [...container.querySelectorAll('.card-projeto')].map((el, i) => ({
        el,
        categorias: lista[i].categorias,
        tags: lista[i].tags
    }));
}

// MOSAICO: cada card ocupa só a altura que precisa (títulos e tags de 1 ou 2 linhas).
// O CSS cria linhas de 1px e aqui dizemos quantas linhas cada card ocupa.
// As colunas continuam sendo as do CSS (1 no celular, 2 a partir de 768px).
const ESPACO_MOSAICO = 30; // mesmo valor do espaço entre os cards
let quadroMosaico = null;

function organizarMosaico() {
    cards.forEach(({ el }) => {
        if (el.style.display === 'none') return;
        const conteudo = el.firstElementChild; // .card-content
        const altura = conteudo.getBoundingClientRect().height;
        el.style.gridRowEnd = `span ${Math.ceil(altura + ESPACO_MOSAICO)}`;
    });
}

function agendarMosaico() {
    cancelAnimationFrame(quadroMosaico);
    quadroMosaico = requestAnimationFrame(organizarMosaico);
}

// Recalcula sempre que o tamanho de um card mudar (resize, fonte carregando, card aparecendo)
function observarMosaico() {
    const observador = new ResizeObserver(agendarMosaico);
    cards.forEach(({ el }) => observador.observe(el.firstElementChild));
}

const passaNaTag = card => tagsAtivas.every(id => card.tags.includes(id));
const passaNaCategoria = (card, cat) => cat === 'all' || card.categorias.includes(cat);

// Botões de categoria: só clica quem tem peça (considerando a tag escolhida)
function atualizarBotoes() {
    botoesCategoria.forEach(btn => {
        const filtro = btn.dataset.filter;
        const disponivel = cards.some(c => passaNaTag(c) && passaNaCategoria(c, filtro));
        btn.disabled = !disponivel;
        btn.classList.toggle('is-indisponivel', !disponivel);
    });

    // A categoria ativa ficou vazia: volta para "Todos"
    const ativo = botoesCategoria.find(b => b.dataset.filter === categoriaAtiva);
    if (ativo && ativo.disabled) categoriaAtiva = 'all';

    botoesCategoria.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === categoriaAtiva);
    });

    // Chips dos cards: a tag escolhida continua no card, destacada (roxo forte, igual ao hover)
    grid.querySelectorAll('.tag-chip').forEach(chip => {
        const selecionada = tagsAtivas.includes(chip.dataset.tag);
        chip.classList.toggle('is-selected', selecionada);
        chip.setAttribute('aria-pressed', selecionada);
    });

    atualizarBarraTags();
}

// Barra com as tags escolhidas: nome + X para remover
function atualizarBarraTags() {
    barraTags.hidden = tagsAtivas.length === 0;
    barraTags.innerHTML = tagsAtivas.map(id => {
        const tag = TAGS.find(t => t.id === id);
        return `<span class="tag-ativa">${tag.label}<button type="button" class="tag-remover" data-tag="${id}" aria-label="Remover tag ${tag.label}">&times;</button></span>`;
    }).join('');
}

function atualizarCards() {
    cards.forEach(card => {
        const mostrar = passaNaTag(card) && passaNaCategoria(card, categoriaAtiva);
        card.el.style.display = mostrar ? 'block' : 'none';
    });
    organizarMosaico();
}

// Atualiza botões na hora e troca os cards com a animação (some 0.2s, aparece 0.3s)
function atualizar(animar = true) {
    atualizarBotoes();

    clearTimeout(temporizador);
    if (!animar) { atualizarCards(); return; }

    grid.classList.add('is-filtrando');
    temporizador = setTimeout(() => {
        atualizarCards();
        requestAnimationFrame(() => grid.classList.remove('is-filtrando'));
    }, 200);
}

// Sobe suavemente até o topo da seção (categorias) e, ao mesmo tempo, troca os cards.
// Para a página não "pular" para o footer quando os cards diminuem no meio da subida,
// a altura da lista fica travada até a rolagem terminar.
function subirEAtualizar(mudar) {
    const filtros = document.querySelector('.filtros-container');
    const header = document.getElementById('header-placeholder');
    const alturaHeader = header ? header.offsetHeight : 0;
    const destino = Math.max(0, filtros.getBoundingClientRect().top + window.scrollY - alturaHeader - 40);

    // Já está no topo (ou acima): só atualiza
    if (window.scrollY <= destino + 2) { mudar(); return; }

    grid.style.minHeight = grid.offsetHeight + 'px';
    window.scrollTo({ top: destino, behavior: 'smooth' });
    mudar();

    // Libera a altura quando a rolagem termina (ou no máximo em 1 segundo)
    const inicio = performance.now();
    (function esperar() {
        const chegou = Math.abs(window.scrollY - destino) <= 2;
        if (chegou || performance.now() - inicio > 1000) grid.style.minHeight = '';
        else requestAnimationFrame(esperar);
    })();
}

function configurarFiltros() {
    botoesCategoria = [...document.querySelectorAll('.filtros-container .btn-filtro')];

    botoesCategoria.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.disabled || btn.classList.contains('active')) return;
            categoriaAtiva = btn.dataset.filter;
            atualizar();
        });
    });

    // Barra de tags escolhidas (fica logo embaixo das categorias)
    barraTags = document.createElement('div');
    barraTags.className = 'tags-ativas';
    barraTags.hidden = true;
    document.querySelector('.filtros-container').insertAdjacentElement('afterend', barraTags);

    // Clique numa tag do card: seleciona; clicar de novo numa tag já selecionada, remove
    grid.addEventListener('click', e => {
        const chip = e.target.closest('.tag-chip');
        if (!chip) return;
        const tagClicada = chip.dataset.tag;
        subirEAtualizar(() => {
            if (tagsAtivas.includes(tagClicada)) {
                tagsAtivas = tagsAtivas.filter(id => id !== tagClicada);
            } else {
                tagsAtivas.push(tagClicada);
            }
            atualizar();
        });
    });

    // Clique no X de uma tag escolhida: remove da seleção
    barraTags.addEventListener('click', e => {
        const remover = e.target.closest('.tag-remover');
        if (!remover) return;
        const tagRemovida = remover.dataset.tag;
        subirEAtualizar(() => {
            tagsAtivas = tagsAtivas.filter(id => id !== tagRemovida);
            atualizar();
        });
    });

    // Links de fora: pecas.html?categoria=site  e/ou  pecas.html?tag=ebook
    const params = new URLSearchParams(window.location.search);
    const categoriaUrl = params.get('categoria');
    const tagUrl = params.get('tag');

    if (tagUrl) {
        const tag = TAG_POR_CHAVE.get(chave(tagUrl));
        if (tag) tagsAtivas = [tag.id];
    }
    if (categoriaUrl && botoesCategoria.some(b => b.dataset.filter === categoriaUrl)) {
        categoriaAtiva = categoriaUrl;
    }

    atualizar(false);
}

carregarProjetos().then(projetos => {
    renderizarCards(projetos, 'lista-projetos-designs');
    configurarFiltros();
    observarMosaico();
}).catch(erro => {
    console.error("Erro ao inicializar portfólio:", erro);
});
