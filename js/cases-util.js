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

    // Imagens que aparecem ao passar o mouse no card (máx. 6 por padrão)
    function resolverPrevia(p, imagens) {
        if (Array.isArray(p.previa) && p.previa.length) {
            return p.previa.map(i => (typeof i === 'number' && p.pasta) ? caminho(p, i) : i);
        }
        const max = p.qtdPrevia || 6;
        if (imagens.length <= max) return imagens.slice();

        const saida = [];
        for (let i = 0; i < max; i++) {
            saida.push(imagens[Math.round(i * (imagens.length - 1) / (max - 1))]);
        }
        return saida;
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
