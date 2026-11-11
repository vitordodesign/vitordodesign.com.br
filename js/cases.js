/* ==========================================================
   PÁGINA CASES - lista os cases, um embaixo do outro
   ========================================================== */
import './cases-util.js';
import { ativarPreview } from './cases-preview.js';

async function iniciar() {
    const lista = document.getElementById('lista-cases');
    if (!lista) return;

    try {
        const resposta = await fetch('./dados-projetos.json');
        const dados = await resposta.json();

        const cases = dados
            .filter(p => p.tipo === 'cases')
            .map(window.CasesUtil.normalizar)
            .filter(p => p.imagens.length);

        if (!cases.length) {
            lista.innerHTML = '<p class="cases-vazio">Novos cases em breve.</p>';
            return;
        }

        lista.innerHTML = cases.map(p => `
            <article class="case-item">
                <a href="projeto-cases.html?id=${p.id}" class="card-link" draggable="false">
                    <div class="card-content">
                        <div class="case-media">
                            <img class="case-img" src="${p.thumb}" alt="${p.titulo}" draggable="false">
                            <span class="case-hint">Passe o mouse para ver mais</span>
                            <div class="case-progress"></div>
                        </div>
                        <div class="card-text">
                            <h3>${p.titulo}</h3>
                            <p>${p.descricao}</p>
                        </div>
                    </div>
                </a>
            </article>
        `).join('');

        lista.querySelectorAll('.case-item').forEach((item, i) => {
            ativarPreview(item.querySelector('.case-media'), cases[i].previa);
        });

    } catch (erro) {
        console.error('Erro ao carregar os cases:', erro);
    }
}

iniciar();
