/* ==========================================================
   HOME - carrossel de cases ("Confira meus principais cases")
   Um card por case. Setas (iguais às de peças e sites), arrastar
   com o mouse/dedo e prévia ao passar o mouse no card.
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

        const cases = (await Promise.all(
            dados.filter(p => p.tipo === 'cases').map(window.CasesUtil.normalizar)
        )).filter(p => p.imagens.length);

        if (!cases.length) { bloco.hidden = true; return; }

        track.innerHTML = cases.map(p => `
            <div class="case-slide">
                <a href="projeto-cases.html?id=${p.id}" class="card-link" draggable="false">
                    <div class="card-content">
                        <div class="case-media">
                            <img class="case-img" src="${p.thumb}" alt="${p.titulo}" draggable="false">
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
    const prev = bloco.querySelector('.nav-home.prev');
    const next = bloco.querySelector('.nav-home.next');
    const mask = bloco.querySelector('.cases-mask');

    // Só 1 case: sem setas e sem arrastar
    if (total < 2) return;

    let atual = 0;

    const larguraPasso = () => track.querySelector('.case-slide').offsetWidth + GAP;

    // Vai para o case "i" e mostra cada seta só se houver para onde ir
    const ir = (i) => {
        atual = Math.min(total - 1, Math.max(0, i));
        track.style.transform = `translateX(${-atual * larguraPasso()}px)`;
        prev.classList.toggle('disabled', atual === 0);
        next.classList.toggle('disabled', atual === total - 1);
    };

    prev.addEventListener('click', () => ir(atual - 1));
    next.addEventListener('click', () => ir(atual + 1));
    window.addEventListener('resize', () => ir(atual));

    // --- ARRASTAR (mouse e dedo) ---
    let arrastando = false;
    let inicioX = 0;
    let deslocamento = 0;
    let moveu = false;
    let bloquearClique = false;

    mask.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        arrastando = true;
        moveu = false;
        inicioX = e.clientX;
        deslocamento = 0;
    });

    window.addEventListener('pointermove', (e) => {
        if (!arrastando) return;
        deslocamento = e.clientX - inicioX;

        if (!moveu && Math.abs(deslocamento) > 5) {
            moveu = true;
            track.style.transition = 'none';
            mask.classList.add('is-dragging');
        }
        if (!moveu) return;

        // nas pontas (sem case para mostrar) o arraste fica "pesado"
        let d = deslocamento;
        if ((atual === 0 && d > 0) || (atual === total - 1 && d < 0)) d *= 0.3;
        track.style.transform = `translateX(${-atual * larguraPasso() + d}px)`;
    });

    const soltar = () => {
        if (!arrastando) return;
        arrastando = false;
        mask.classList.remove('is-dragging');
        track.style.transition = ''; // volta para a transição do CSS

        if (moveu) {
            if (deslocamento < -50) ir(atual + 1);
            else if (deslocamento > 50) ir(atual - 1);
            else ir(atual);

            // evita abrir o case ao soltar o mouse depois de arrastar
            bloquearClique = true;
            setTimeout(() => { bloquearClique = false; }, 80);
        }
    };

    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);

    track.addEventListener('click', (e) => {
        if (bloquearClique) e.preventDefault();
    }, true);

    ir(0);
}

iniciar();
