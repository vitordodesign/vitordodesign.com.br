/* ==========================================================
   CASES - utilitário de dados
   Descobre sozinho quais imagens existem na pasta do case:
   procura pasta + prefixo + 1, 2, 3... + extensão e fica só
   com as que existem. Não importa se faltam números ou se
   as imagens foram subidas fora de ordem.

   JSON mínimo de um case:
   "pasta": "img/portfolio/cases/hot-burger/",
   "prefixo": "hot-burger-",
   "extensao": "jpg"

   Opcional: "quantidade" = maior número que pode existir (padrão 60).

   Funciona como <script> comum e também importado em módulos.
   ========================================================== */
(function (global) {

    const MAX_PADRAO = 60;   // até qual número procurar, se o JSON não disser
    const TOTAL_PREVIA = 6;  // capa + 5 sorteadas

    function caminho(p, n) {
        const pasta = p.pasta.endsWith('/') ? p.pasta : p.pasta + '/';
        return `${pasta}${p.prefixo || ''}${n}.${p.extensao || 'jpg'}`;
    }

    // Pergunta ao servidor se a imagem existe (só o cabeçalho, sem baixar a imagem).
    // Exige content-type de imagem para não confundir com páginas "404" que respondem 200.
    async function imagemExiste(url) {
        try {
            const resposta = await fetch(url, { method: 'HEAD' });
            return resposta.ok && (resposta.headers.get('content-type') || '').startsWith('image/');
        } catch (erro) {
            return false;
        }
    }

    // Lista, na ordem numérica, só as imagens que existem
    async function descobrirImagens(p) {
        if (Array.isArray(p.imagens) && p.imagens.length) return p.imagens; // lista manual tem prioridade
        if (!p.pasta) return [];

        const max = p.quantidade || MAX_PADRAO;
        const numeros = Array.from({ length: max }, (_, i) => i + 1);
        const existe = await Promise.all(numeros.map(n => imagemExiste(caminho(p, n))));

        return numeros.filter((n, i) => existe[i]).map(n => caminho(p, n));
    }

    function embaralhar(lista) {
        const a = lista.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // Prévia ao passar o mouse: a capa (sempre) + 5 sorteadas entre TODAS as outras,
    // a cada vez que a página carrega. As sorteadas ficam na ordem do manual.
    function resolverPrevia(p, imagens) {
        const capa = p.thumb || imagens[0];
        const demais = imagens.filter(src => src !== capa);
        const sorteadas = embaralhar(demais).slice(0, TOTAL_PREVIA - 1);
        sorteadas.sort((a, b) => imagens.indexOf(a) - imagens.indexOf(b));
        return [capa, ...sorteadas];
    }

    // Completa o item: imagens, capa (thumb) e prévia.
    // Use com await: await Promise.all(lista.map(CasesUtil.normalizar))
    async function normalizar(p) {
        if (p.tipo !== 'cases') return p;
        p.imagens = await descobrirImagens(p);
        p.thumb = p.thumb || p.imagens[0];
        p.previa = resolverPrevia(p, p.imagens);
        return p;
    }

    global.CasesUtil = { descobrirImagens, resolverPrevia, normalizar };

})(window);
