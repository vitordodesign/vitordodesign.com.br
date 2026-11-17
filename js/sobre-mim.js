document.addEventListener('DOMContentLoaded', () => {

    // 1. LÓGICA DO ACCORDION (FECHAR TODOS OS OUTROS AO ABRIR UM)
    // Selecionamos tanto o .accordion-header quanto o .accordion-card (gatilhos)
    const gatilhos = document.querySelectorAll('.accordion-header, .accordion-card');

    gatilhos.forEach(gatilho => {
        gatilho.addEventListener('click', () => {
            // Encontra o pai correto (seja ele de skill ou de experiência)
            const currentItem = gatilho.closest('.accordion-item, .accordion-simple-item');
            const isOpen = currentItem.classList.contains('active');

            // Primeiro: Fecha absolutamente todos os itens da página
            document.querySelectorAll('.accordion-item, .accordion-simple-item').forEach(item => {
                item.classList.remove('active');
            });

            // Segundo: Se o item clicado não estava aberto, abre ele
            if (!isOpen) {
                currentItem.classList.add('active');
            }
        });
    });

    // As barras de nível (.software-skill-level) são animadas pelo js/inicio.js,
    // chamado pelo main.js, somente quando aparecem na tela.

});
