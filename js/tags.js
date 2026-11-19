/* ==========================================================
   TAGS - lista oficial e funções compartilhadas
   (usado pela página Peças e pelo carrossel da Início)
   ========================================================== */

// A ordem aqui é a ordem em que as tags aparecem nos cards
export const TAGS = [
    // recursos dos sites (antigas categorias da página Sites): aparecem primeiro
    { id: 'portfolio', label: 'Portfólio' },
    { id: 'onepage', label: 'One Page' },
    { id: 'blog', label: 'Blog' },
    { id: 'anuncio', label: 'Anúncio' },
    { id: 'motion', label: 'Motion' },
    { id: 'reel', label: 'Reel' },
    { id: 'ebook', label: 'Ebook' },
    { id: 'carrossel', label: 'Carrossel' },
    { id: 'cartao-de-visita', label: 'Cartão de visita' },
    { id: 'papel-timbrado', label: 'Papel timbrado' },
    { id: 'assinatura-de-email', label: 'Assinatura de email' },
    { id: 'illustrator', label: 'Illustrator' },
    { id: 'premiere', label: 'Premiere' },
    { id: 'photoshop', label: 'Photoshop' },
    { id: 'after-effects', label: 'After Effects' },
    { id: 'coreldraw', label: 'CorelDRAW' },
    { id: 'wordpress', label: 'WordPress' },
    { id: 'elementor', label: 'Elementor' },
    { id: 'betheme', label: 'BeTheme' },
    { id: 'html', label: 'HTML5' },
    { id: 'css', label: 'CSS3' },
    { id: 'javascript', label: 'JavaScript' },
    { id: '16-9', label: '16:9' },
    { id: '4-3', label: '4:3' },
    { id: '3-4', label: '3:4' }
];

// "After Effects", "after-effects" e "aftereffects" viram a mesma chave
export const chave = texto => String(texto)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

export const TAG_POR_CHAVE = new Map();
TAGS.forEach(tag => {
    TAG_POR_CHAVE.set(chave(tag.id), tag);
    TAG_POR_CHAVE.set(chave(tag.label), tag);
});

// Apelidos: nomes alternativos que também valem (use no campo "tags")
const APELIDOS = {
    html5: 'html', css3: 'css', js: 'javascript',
    ai: 'illustrator', ps: 'photoshop', pr: 'premiere',
    ae: 'after-effects', corel: 'coreldraw'
};
Object.entries(APELIDOS).forEach(([apelido, id]) => {
    TAG_POR_CHAVE.set(chave(apelido), TAGS.find(t => t.id === id));
});

// Categorias da peça (campo "categoria" do dados-projetos.json)
export function categoriasDoProjeto(projeto) {
    return projeto.categoria || [];
}

// Tags do projeto: valem SÓ as que estão no campo "tags" do dados-projetos.json.
export function tagsDoProjeto(projeto) {
    const origem = Array.isArray(projeto.tags) ? projeto.tags : [];
    const encontradas = new Set();

    origem.forEach(item => {
        const tag = TAG_POR_CHAVE.get(chave(item));
        if (tag) {
            encontradas.add(tag.id);
        } else {
            // Ajuda a achar erro de digitação: aparece no Console do navegador (F12)
            console.warn(`[tags] "${item}" não existe na lista TAGS (js/tags.js). Peça: ${projeto.id}`);
        }
    });

    return TAGS.filter(t => encontradas.has(t.id)).map(t => t.id);
}
