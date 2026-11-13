/* ==========================================================
   CASES - utilitário de dados
   Transforma o item "cases" do dados-projetos.json em uma lista
   de imagens (pasta + prefixo + quantidade), para você não
   precisar escrever os 30 caminhos na mão.
   Funciona como <script> comum e também importado em módulos.
   ========================================================== */
(function (global) {

    function caminho(p, n) {
        const pasta = p.pasta.endsWith('/') ? p.pasta : p.pasta + '/';
        return `${pasta}${p.prefixo || ''}${n}.${p.extensao || 'jpg'}`;
    }

    // Lista completa de imagens do case (na ordem 1, 2, 3...)
    function resolverImagens(p) {
        if (Array.isArray(p.imagens) && p.imagens.length) return p.imagens; // lista manual tem prioridade
        if (!p.pasta || !p.quantidade) return [];

        const ignorar = new Set(p.ignorar || []);
        const lista = [];
        for (let n = 1; n <= p.quantidade; n++) {
            if (!ignorar.has(n)) lista.push(caminho(p, n));
        }
        return lista;
    }

    function embaralhar(lista) {
        const a = lista.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // Imagens que aparecem ao passar o mouse: a capa (sempre) + 5 sorteadas
    // entre TODAS as imagens do case, a cada vez que a página carrega.
    // Quer fixar a lista? Use "previaFixa": [1, 5, 11] no JSON.
    function resolverPrevia(p, imagens) {
        if (Array.isArray(p.previaFixa) && p.previaFixa.length) {
            return p.previaFixa.map(i => (typeof i === 'number' && p.pasta) ? caminho(p, i) : i);
        }
        const total = p.qtdPrevia || 6;
        const capa = p.thumb || imagens[0];
        const demais = imagens.filter(src => src !== capa);
        const sorteadas = embaralhar(demais).slice(0, total - 1);
        // mantém a ordem original do manual (capa, depois as sorteadas em sequência)
        sorteadas.sort((a, b) => imagens.indexOf(a) - imagens.indexOf(b));
        return [capa, ...sorteadas];
    }

    // Completa o item: imagens, capa (thumb) e prévia
    function normalizar(p) {
        if (p.tipo !== 'cases') return p;
        p.imagens = resolverImagens(p);
        p.thumb = p.thumb || p.imagens[0];
        p.previa = resolverPrevia(p, p.imagens);
        return p;
    }

    global.CasesUtil = { resolverImagens, resolverPrevia, normalizar };

})(window);
