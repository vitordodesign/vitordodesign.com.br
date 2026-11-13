/* ==========================================================
   HOME - carrossel de cases ("Confira meus principais cases")
   Um card por case. Setas, clique e arraste (celular).
   Ao passar o mouse no card, mostra outras imagens do case.
   ========================================================== */
import './cases-util.js';
import { ativarPreview } from './cases-preview.js';

const GAP = 60; // precisa ser igual ao "gap" de .cases-track no cases.css

async function iniciar() {
    const bloco = document.getElementById('cases-home');
    const track = document.getElementById('cases-track');
    if (!bloco || !track) return;

    try {
        const resposta = await fetch('./dados-projetos.json');
        const dados = await resposta.json();

        const cases = dados
            .filter(p => p.tipo === 'cases')
            .map(window.CasesUtil.normalizar)
            .filter(p => p.imagens.length);

        if (!cases.length) { bloco.hidden = true; return; }

        track.innerHTML = cases.map(p => `
            <div class="case-slide">
                <a href="projeto-cases.html?id=${p.id}" class="card-link" draggable="false">
                    <div class="card-content">
                        <div class="case-media">
                            <img class="case-img" src="${p.thumb}" alt="${p.titulo}" draggable="false">
                            <div class="case-progress"></div>
                        </div>
                        <div class="card-text">
                            <h3>${p.titulo}</h3>
                        </div>
                    </div>
                </a>
            </div>
        `).join('');

        track.querySelectorAll('.case-slide').forEach((slide, i) => {
            ativarPreview(slide.querySelector('.case-media'), cases[i].previa);
        });

        configurarCarrossel(bloco, track, cases.length);

    } catch (erro) {
        console.error('Erro ao carregar o carrossel de cases:', erro);
    }
}

function configurarCarrossel(bloco, track, total) {
    const controles = bloco.querySelector('.cases-controls');
    const prev = bloco.querySelector('.cases-btn.prev');
    const next = bloco.querySelector('.cases-btn.next');
    const contador = bloco.querySelector('.cases-count');
    const mask = bloco.querySelector('.cases-mask');

    // Só 1 case: não precisa de setas
    if (total < 2) { if (controles) controles.hidden = true; return; }

    let atual = 0;

    const ir = (i) => {
        atual = Math.min(total - 1, Math.max(0, i));
        track.style.transform = `translateX(calc(${-atual * 100}% - ${atual * GAP}px))`;
        prev.classList.toggle('is-disabled', atual === 0);
        next.classList.toggle('is-disabled', atual === total - 1);
        contador.textContent = `${String(atual + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    };

    prev.addEventListener('click', () => ir(atual - 1));
    next.addEventListener('click', () => ir(atual + 1));

    // Deslizar o dedo no celular
    let inicioX = null;
    let deslizou = false;

    mask.addEventListener('touchstart', (e) => { inicioX = e.touches[0].clientX; }, { passive: true });
    mask.addEventListener('touchend', (e) => {
        if (inicioX === null) return;
        const dx = e.changedTouches[0].clientX - inicioX;
        inicioX = null;
        if (Math.abs(dx) > 50) {
            ir(atual + (dx < 0 ? 1 : -1));
            deslizou = true;
            setTimeout(() => { deslizou = false; }, 300);
        }
    });
    track.addEventListener('click', (e) => { if (deslizou) e.preventDefault(); }, true);

    ir(0);
}

iniciar();
