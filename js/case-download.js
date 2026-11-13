/* ==========================================================
   PÁGINA DO CASE - botão "Baixar Case em PDF"
   O botão só aparece se o case tiver o campo "pdf" no JSON:
   "pdf": "pdf/hot-burger.pdf"
   (opcional) "pdfNome": "Hot Burger - Manual de Marca.pdf"
   ========================================================== */
(async function () {
    const bloco = document.getElementById('download-case');
    const botao = document.getElementById('btn-baixar-case');
    if (!bloco || !botao) return;

    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;

    try {
        const resposta = await fetch('./dados-projetos.json');
        const projetos = await resposta.json();
        const projeto = projetos.find(p => p.id === id);
        if (!projeto || !projeto.pdf) return;

        const nomeArquivo = projeto.pdfNome || `${projeto.id}.pdf`;
        botao.href = projeto.pdf;
        botao.setAttribute('download', nomeArquivo);
        bloco.hidden = false;
    } catch (erro) {
        console.error('Erro ao configurar o download do case:', erro);
    }
})();
