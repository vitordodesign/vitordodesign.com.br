/* ==========================================================
   CASES - prévia automática dentro do card
   Desktop: ao passar o mouse no card, as imagens do case
            passam sozinhas (uma a cada 2 segundos).
   Celular: quando o card fica visível na tela por alguns
            segundos, as imagens começam a passar sozinhas.
   Ao tirar o mouse (ou o card sair da tela) volta para a capa.
   ========================================================== */

const INTERVALO = 1000;        // tempo entre uma imagem e outra
const ATRASO_MOUSE = 0;     // desktop: tempo até a 1ª troca depois de passar o mouse
const ATRASO_VISIVEL = 1000;   // celular: tempo com o card na tela até começar

export function ativarPreview(media, imagens) {
    if (!media || !imagens || imagens.length < 2) return;

    // Quem pede "menos movimento" no sistema não recebe animação automática
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ehToque = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const alvo = media.closest('.card-content') || media;

    let camadas = null;
    let atual = 0;          // posição da imagem que está aparecendo (0 = capa)
    let ordemZ = 1;
    let espera = null;
    let intervalo = null;

    // Cria as imagens só na primeira vez (economiza dados de quem nunca passa o mouse)
    const criarCamadas = () => {
        camadas = imagens.map(src => {
            const img = new Image();
            img.className = 'case-layer';
            img.alt = '';
            img.draggable = false;
            img.src = src;
            media.appendChild(img);
            return img;
        });
    };

    // A nova imagem entra por cima e a anterior só sai depois, sem "piscar" a capa
    const mostrar = (i) => {
        const anterior = atual;
        ordemZ += 1;
        camadas[i].style.zIndex = ordemZ;
        camadas[i].classList.add('is-on');
        atual = i;

        if (anterior !== i) {
            setTimeout(() => {
                if (atual !== anterior) camadas[anterior].classList.remove('is-on');
            }, 450);
        }
    };

    const trocar = () => {
        const proxima = (atual + 1) % imagens.length;
        const camada = camadas[proxima];
        // se a imagem ainda não carregou, espera o próximo ciclo
        if (!camada.complete || !camada.naturalWidth) return;
        mostrar(proxima);
    };

    const iniciar = (atraso) => {
        parar();
        if (!camadas) criarCamadas();
        espera = setTimeout(() => {
            trocar();
            intervalo = setInterval(trocar, INTERVALO);
        }, atraso);
    };

    const parar = () => {
        clearTimeout(espera);
        clearInterval(intervalo);
        espera = null;
        intervalo = null;
        if (!camadas) return;
        atual = 0;
        ordemZ = 1;
        camadas.forEach(c => { c.classList.remove('is-on'); c.style.zIndex = ''; });
    };

    if (ehToque) {
        // Celular/tablet: começa depois de alguns segundos com o card visível
        let visivel = false;

        const observador = new IntersectionObserver((entradas) => {
            visivel = entradas[0].isIntersecting;
            if (visivel && !document.hidden) iniciar(ATRASO_VISIVEL);
            else parar();
        }, { threshold: 0.6 });
        observador.observe(alvo);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) parar();
            else if (visivel) iniciar(ATRASO_VISIVEL);
        });
    } else {
        // Desktop: mouse em cima do card
        alvo.addEventListener('pointerenter', (e) => {
            if (e.pointerType === 'mouse') iniciar(ATRASO_MOUSE);
        });
        alvo.addEventListener('pointerleave', (e) => {
            if (e.pointerType === 'mouse') parar();
        });
    }
}
