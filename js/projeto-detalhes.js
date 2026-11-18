// Variáveis Globais do Lightbox para a Galeria
let lightboxImagesArray = [];
let currentLightboxIndex = 0;

window.fecharLightbox = fecharLightbox;
window.mudarImagemLightbox = mudarImagemLightbox;
window.abrirLightbox = abrirLightbox;

// Função auxiliar para converter qualquer link do YouTube (Normal ou Shorts) em Embed válido
function obterEmbedYoutube(url) {
    if (!url) return '';
    let videoId = '';

    if (url.includes('/shorts/')) {
        videoId = url.split('/shorts/')[1].split(/[?#]/)[0];
    } else if (url.includes('v=')) {
        videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
    } else if (url.includes('/embed/')) {
        return url;
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

async function carregarProjeto() {
    const urlParams = new URLSearchParams(window.location.search);
    const projetoId = urlParams.get('id');

    if (!projetoId) {
        console.error("ID do projeto não encontrado na URL.");
        return;
    }

    // Configura o Worker do PDF.js (CDN JsDelivr)
    if (typeof window !== 'undefined' && 'pdfjsLib' in window) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }

    try {
        const response = await fetch('./dados-projetos.json');
        const projetos = await response.json();

        // Cases: descobre as imagens que existem na pasta do case (js/cases-util.js)
        if (window.CasesUtil) await Promise.all(projetos.map(window.CasesUtil.normalizar));

        const projeto = projetos.find(p => p.id === projetoId);

        if (projeto) {
            // Título e Descrição
            const txtTitulo = document.getElementById('projeto-titulo');
            const txtDescricao = document.getElementById('projeto-descricao');
            if (txtTitulo) txtTitulo.textContent = projeto.titulo;
            if (txtDescricao) txtDescricao.textContent = projeto.descricao;

            // Botão de acesso ao site online
            const btnLink = document.querySelector('.button-open-site') || document.getElementById('btn-link-projeto');
            if (btnLink) {
                if (projeto.linkOnline) {
                    btnLink.href = projeto.linkOnline;
                    btnLink.style.display = 'inline-flex';
                    btnLink.style.width = 'max-content'; // Impede o botão de esticar a tela inteira
                } else {
                    btnLink.style.display = 'none';
                }
            }

            // Tags da peça (clicar leva para a página Peças já filtrada por ela)
            const containerTags = document.getElementById('projeto-tags');
            if (containerTags) {
                const { TAGS, tagsDoProjeto } = await import('./tags.js');
                const ids = tagsDoProjeto(projeto);
                containerTags.innerHTML = ids.map(id => {
                    const tag = TAGS.find(t => t.id === id);
                    // Cases não aparecem na página Peças: lá a tag fica só como texto
                    if (projeto.tipo === 'cases') return `<span class="tag-projeto">${tag.label}</span>`;
                    return `<a class="tag-projeto" href="pecas.html?tag=${encodeURIComponent(id)}">${tag.label}</a>`;
                }).join('');
                // Sem tags: esconde a faixa do topo
                if (!ids.length) containerTags.closest('.info-projeto-topo').style.display = 'none';
            }

            // Renderização de Mídia
            const moldura = document.querySelector('.moldura-pc');
            const containerMosaico = document.getElementById('container-mosaico-pdf');

            // --- FORMATO 1: SCROLL ---
            if (projeto.formato === 'scroll') {
                if (moldura && projeto.imagemFull) {
                    moldura.style.display = 'block';
                    moldura.style.overflowY = 'scroll';
                    moldura.innerHTML = `<img src="${projeto.imagemFull}" alt="${projeto.titulo}" style="width: 100%; height: auto; display: block;">`;
                }
                if (containerMosaico) containerMosaico.style.display = 'none';
            }

            // --- FORMATO 2: VÍDEO ---
            else if (projeto.formato === 'video') {
                if (moldura && projeto.videoUrl) {
                    moldura.style.display = 'flex';
                    moldura.style.backgroundColor = 'var(--black-color)';
                    moldura.style.overflow = 'hidden';

                    const embedUrl = obterEmbedYoutube(projeto.videoUrl);

                    moldura.innerHTML = `
                        <iframe src="${embedUrl}" title="${projeto.titulo}" frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            allowfullscreen style="aspect-ratio: 16/9; width: 100%; max-height: 100%; border: none;">
                        </iframe>`;
                }
                if (containerMosaico) containerMosaico.style.display = 'none';
            }

            // --- FORMATO 3: MOSAICO ---
            else if (projeto.formato === 'pdf') {
                if (moldura) moldura.style.display = 'none';

                if (containerMosaico && projeto.pdfUrl) {
                    containerMosaico.style.display = 'grid';
                    containerMosaico.innerHTML = '<p class="loading-pdf">Carregando páginas do PDF...</p>';

                    window.pdfjsLib.getDocument(projeto.pdfUrl).promise.then(async (pdf) => {
                        lightboxImagesArray = [];
                        containerMosaico.innerHTML = '';

                        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                            const page = await pdf.getPage(pageNum);
                            const viewport = page.getViewport({ scale: 2.0 });

                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            canvas.height = viewport.height;
                            canvas.width = viewport.width;

                            await page.render({ canvasContext: context, viewport: viewport }).promise;

                            const imgDataUrl = canvas.toDataURL('image/png');
                            lightboxImagesArray.push(imgDataUrl);

                            const pageIdx = pageNum - 1;
                            const pageDiv = document.createElement('div');

                            const isHorizontal = viewport.width > viewport.height;
                            pageDiv.className = isHorizontal ? 'page-horizontal' : 'page-vertical-quadrada';

                            pageDiv.innerHTML = `
                                <div class="pdf-page-wrapper" style="position: relative; width: 100%;">
                                    <img src="${imgDataUrl}" alt="Página ${pageNum}" onclick="abrirLightbox(${pageIdx})" class="img-mosaico-pdf" style="width: 100%; height: auto; cursor: pointer;">
                                </div>
                            `;
                            containerMosaico.appendChild(pageDiv);
                        }
                    }).catch(err => {
                        console.error("Erro ao carregar ou processar o PDF:", err);
                        containerMosaico.innerHTML = '<p class="erro-pdf">Ocorreu um erro ao carregar as páginas do projeto.</p>';
                    });
                }
            }

            // --- FORMATO 4: GALERIA DE IMAGENS ---
            else if (projeto.imagens) {
                if (moldura) moldura.style.display = 'none';

                if (containerMosaico) {
                    containerMosaico.style.display = 'grid';
                    containerMosaico.innerHTML = ''; // Limpa o container para receber as imagens

                    lightboxImagesArray = projeto.imagens;

                    projeto.imagens.forEach((imgUrl, index) => {
                        const itemWrapper = document.createElement('div');
                        // Inicia com classe padrão, atualizamos quando carregar a imagem real
                        itemWrapper.className = 'page-vertical-quadrada';

                        const img = document.createElement('img');
                        img.src = imgUrl;
                        img.alt = `Imagem ${index + 1} de ${projeto.titulo}`;
                        img.className = 'img-mosaico-pdf';
                        img.style.width = '100%';
                        img.style.height = 'auto';
                        img.style.cursor = 'pointer';

                        // Checa as dimensões da imagem para adaptar o mosaico responsivo
                        img.onload = () => {
                            if (img.naturalWidth > img.naturalHeight) {
                                itemWrapper.className = 'page-horizontal';
                            } else {
                                itemWrapper.className = 'page-vertical-quadrada';
                            }
                        };

                        // Clique para o lightbox
                        img.addEventListener('click', () => {
                            abrirLightbox(index);
                        });

                        const innerWrapper = document.createElement('div');
                        innerWrapper.className = 'pdf-page-wrapper';
                        innerWrapper.style.position = 'relative';
                        innerWrapper.style.width = '100%';

                        innerWrapper.appendChild(img);
                        itemWrapper.appendChild(innerWrapper);
                        containerMosaico.appendChild(itemWrapper);
                    });
                }
            }

            // Renderiza projetos relacionados
            renderizarRelacionados(projetos, projeto);

        } else {
            console.error("Projeto correspondente ao ID não foi localizado.");
        }
    } catch (error) {
        console.error("Erro ao carregar o arquivo JSON de dados:", error);
    }
}

// === LIGHTBOX: carrossel colado ===
// Todas as imagens ficam lado a lado; a escolhida fica sempre no meio da tela
// e as outras coladas nela, mesmo as que ficam fora da tela.
let lightboxTrack = null;
let lightboxConstruidoCom = null;   // lista de imagens que já virou slides
let lightboxQtdConstruida = 0;
let lightboxDeslocamento = 0;       // posição atual da faixa (px)
let lbArrastando = false;           // arrastar com mouse ou dedo
let lbFoiArrastado = false;
let lbInicioX = 0;

function lightboxAberto() {
    const modal = document.getElementById('lightbox-modal');
    return !!modal && modal.style.display === 'flex';
}

function construirLightbox() {
    const content = document.querySelector('#lightbox-modal .lightbox-content');
    if (!content) return false;

    if (!lightboxTrack) {
        const viewport = document.createElement('div');
        viewport.className = 'lightbox-viewport';
        lightboxTrack = document.createElement('div');
        lightboxTrack.className = 'lightbox-track';
        viewport.appendChild(lightboxTrack);
        content.prepend(viewport);
        configurarArrasteLightbox(viewport);
    }

    // Só reconstrói se a lista de imagens mudou
    if (lightboxConstruidoCom === lightboxImagesArray &&
        lightboxQtdConstruida === lightboxImagesArray.length) return true;

    lightboxTrack.innerHTML = '';
    lightboxImagesArray.forEach((src, i) => {
        const slide = document.createElement('div');
        slide.className = 'lightbox-slide';

        const img = document.createElement('img');
        img.src = src;
        img.alt = `Imagem ${i + 1}`;
        img.draggable = false;
        img.addEventListener('load', () => centralizarLightbox(false)); // largura só é conhecida após carregar

        slide.appendChild(img);
        slide.addEventListener('click', () => {
            if (lbFoiArrastado) return;   // foi um arrastar, não um clique
            if (i !== currentLightboxIndex) irParaImagemLightbox(i);
        });
        lightboxTrack.appendChild(slide);
    });

    lightboxConstruidoCom = lightboxImagesArray;
    lightboxQtdConstruida = lightboxImagesArray.length;
    return true;
}

// Move a faixa para a imagem atual ficar exatamente no meio da tela
function centralizarLightbox(animar = true) {
    if (!lightboxTrack) return;
    const slides = [...lightboxTrack.children];
    const ativo = slides[currentLightboxIndex];
    if (!ativo) return;

    slides.forEach((slide, i) => slide.classList.toggle('active', i === currentLightboxIndex));

    const viewport = lightboxTrack.parentElement;
    const deslocamento = viewport.clientWidth / 2 - (ativo.offsetLeft + ativo.offsetWidth / 2);

    lightboxDeslocamento = deslocamento;
    lightboxTrack.style.transition = animar ? '' : 'none';
    lightboxTrack.style.transform = `translateX(${deslocamento}px)`;
    if (!animar) {
        void lightboxTrack.offsetWidth;   // aplica sem animação e depois libera a animação
        lightboxTrack.style.transition = '';
    }
}

// Arrastar (mouse ou dedo): a faixa acompanha o movimento e, ao soltar,
// vai para a próxima/anterior se arrastou mais de 50px (igual ao carrossel da Início)
function configurarArrasteLightbox(viewport) {
    const posicaoX = e => {
        if (e.touches && e.touches.length) return e.touches[0].clientX;
        if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX;
        return e.clientX;
    };

    const iniciar = e => {
        if (e.type === 'mousedown' && e.button !== 0) return;
        lbArrastando = true;
        lbFoiArrastado = false;
        lbInicioX = posicaoX(e);
        lightboxTrack.style.transition = 'none';
        viewport.classList.add('is-dragging');
    };

    const mover = e => {
        if (!lbArrastando) return;
        const dx = posicaoX(e) - lbInicioX;
        if (Math.abs(dx) > 5) {
            if (e.cancelable) e.preventDefault();
            lbFoiArrastado = true;
            lightboxTrack.style.transform = `translateX(${lightboxDeslocamento + dx}px)`;
        }
    };

    const terminar = e => {
        if (!lbArrastando) return;
        lbArrastando = false;
        viewport.classList.remove('is-dragging');
        lightboxTrack.style.transition = '';

        if (lbFoiArrastado) {
            const diff = lbInicioX - posicaoX(e);
            const ultimo = lightboxImagesArray.length - 1;
            let novo = currentLightboxIndex;
            if (diff > 50) novo = Math.min(novo + 1, ultimo);
            else if (diff < -50) novo = Math.max(novo - 1, 0);
            irParaImagemLightbox(novo);   // se não mudou, volta para o meio
        }
        setTimeout(() => { lbFoiArrastado = false; }, 50);
    };

    viewport.addEventListener('mousedown', iniciar);
    window.addEventListener('mousemove', mover);
    window.addEventListener('mouseup', terminar);
    viewport.addEventListener('touchstart', iniciar, { passive: true });
    window.addEventListener('touchmove', mover, { passive: false });
    window.addEventListener('touchend', terminar);
    window.addEventListener('touchcancel', terminar);
}

function irParaImagemLightbox(index) {
    currentLightboxIndex = index;
    centralizarLightbox(true);
}

function abrirLightbox(index) {
    const modal = document.getElementById('lightbox-modal');
    if (!modal || !lightboxImagesArray[index]) return;
    if (!construirLightbox()) return;

    currentLightboxIndex = index;
    modal.style.display = 'flex';
    centralizarLightbox(false);
}

function fecharLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function mudarImagemLightbox(direcao) {
    const total = lightboxImagesArray.length;
    if (!total) return;
    irParaImagemLightbox((currentLightboxIndex + direcao + total) % total);
}

// === FUNÇÃO DE PROJETOS RELACIONADOS ===
function renderizarRelacionados(todosProjetos, projetoAtual) {
    const container = document.getElementById('lista-relacionados');
    if (!container) return;

    // Filtra pelo mesmo tipo (websites, designs, etc), removendo o próprio projeto aberto
    let filtrados = todosProjetos.filter(p => p.tipo === projetoAtual.tipo && p.id !== projetoAtual.id);

    // Embaralha aleatoriamente (Algoritmo Fisher-Yates)
    for (let i = filtrados.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtrados[i], filtrados[j]] = [filtrados[j], filtrados[i]];
    }

    // Limita a exibição de 3 projetos no máximo
    filtrados = filtrados.slice(0, 3);

    // Sem outros projetos do mesmo tipo (ex.: só 1 case): esconde a seção inteira
    const secaoRelacionados = container.closest('section');
    if (secaoRelacionados) secaoRelacionados.style.display = filtrados.length ? '' : 'none';

    // Cria o HTML e adiciona na tela
    container.innerHTML = filtrados.map(p => `
        <div class="card-projeto">
            <a href="projeto-${p.tipo}.html?id=${p.id}" class="card-link">
                <div class="card-content">
                    <div class="thumb-wrapper">
                        <img src="${p.thumb}" alt="${p.titulo}">
                    </div>
                    <div class="card-text">
                        <h3>${p.titulo}</h3>
                    </div>
                </div>
            </a>
        </div>
    `).join('');
}

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', () => {
    carregarProjeto();

    const modal = document.getElementById('lightbox-modal');
    if (modal) {
        // Clicar no fundo (fora das imagens e das setas) fecha
        modal.addEventListener('click', function (e) {
            if (lbFoiArrastado) return;   // soltou um arrastar em cima do fundo: não fecha
            if (!e.target.closest('.lightbox-slide, .lightbox-prev, .lightbox-next')) {
                fecharLightbox();
            }
        });
    }

    // Teclado: setas trocam, Esc fecha
    document.addEventListener('keydown', e => {
        if (!lightboxAberto()) return;
        if (e.key === 'ArrowLeft') mudarImagemLightbox(-1);
        else if (e.key === 'ArrowRight') mudarImagemLightbox(1);
        else if (e.key === 'Escape') fecharLightbox();
    });

    // Redimensionar a janela: recentraliza a imagem atual
    window.addEventListener('resize', () => {
        if (lightboxAberto()) centralizarLightbox(false);
    });
});
