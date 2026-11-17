/* ==========================================================
   PÁGINA DO CASE - botão "Baixar Case em PDF"
   O PDF fica na MESMA pasta das imagens do case, com o nome do id:
   img/portfolio/cases/hot-burger/hot-burger.pdf

   Para usar outro caminho ou nome, acrescente no JSON do case:
   "pdf": "pdf/outro-arquivo.pdf"
   ========================================================== */
(async function () {
    const botao = document.getElementById('btn-baixar-case');
    if (!botao) return;

    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;

    // "Hot Burger | Manual de Marca" -> "Hot-Burger-Manual-de-Marca"
    const nomeAmigavel = (texto) => texto
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    try {
        const resposta = await fetch('./dados-projetos.json');
        const projetos = await resposta.json();
        const projeto = projetos.find(p => p.id === id);
        if (!projeto) return;

        const pasta = (projeto.pasta || '').endsWith('/') ? projeto.pasta : (projeto.pasta || '') + '/';
        const caminho = projeto.pdf || `${pasta}${projeto.id}.pdf`;
        const nomeArquivo = projeto.pdfNome || `${nomeAmigavel(projeto.titulo || projeto.id)}.pdf`;

        botao.href = caminho;
        botao.setAttribute('download', nomeArquivo);
    } catch (erro) {
        console.error('Erro ao configurar o download do case:', erro);
    }
})();
