/* ==========================================================
   CASES - prévia ao passar o mouse
   Divide o card em faixas verticais: conforme o mouse anda da
   esquerda para a direita, mostra outras imagens do case.
   Só atua com mouse (no celular o card mostra só a capa).
   ========================================================== */
export function ativarPreview(media, imagens) {
    if (!media || !imagens || imagens.length < 2) return;

    const barra = media.querySelector('.case-progress');
    if (barra) barra.innerHTML = imagens.map(() => '<span></span>').join('');

    let camadas = null;
    let atual = -1;

    // Cria as imagens só na primeira vez que o mouse entra (economiza dados)
    const criarCamadas = () => {
        camadas = imagens.map(src => {
            const img = new Image();
            img.className = 'case-layer';
            img.alt = '';
            img.draggable = false;
            img.src = src;
            media.insertBefore(img, barra);
            return img;
        });
    };

    const mostrar = (i) => {
        if (i === atual) return;
        atual = i;
        camadas.forEach((c, k) => c.classList.toggle('is-on', k === i));
        if (barra) [...barra.children].forEach((b, k) => b.classList.toggle('is-active', k === i));
    };

    media.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse' || camadas) return;
        criarCamadas();
    });

    media.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse' || !camadas) return;
        const r = media.getBoundingClientRect();
        const i = Math.floor(((e.clientX - r.left) / r.width) * imagens.length);
        mostrar(Math.min(imagens.length - 1, Math.max(0, i)));
    });

    media.addEventListener('pointerleave', () => {
        atual = -1;
        if (camadas) camadas.forEach(c => c.classList.remove('is-on'));
        if (barra) [...barra.children].forEach(b => b.classList.remove('is-active'));
    });
}
