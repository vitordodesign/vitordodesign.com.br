export const initSkills = () => {
    // Qualquer barra que tenha data-level (home e sobre mim)
    const barras = document.querySelectorAll('[data-level]');

    const preencher = (barra) => {
        const porcentagem = barra.getAttribute('data-level');
        if (porcentagem) barra.style.width = porcentagem;
    };

    // Navegadores muito antigos: mantém o comportamento anterior
    if (!('IntersectionObserver' in window)) {
        barras.forEach(preencher);
        return;
    }

    // Observa o "trilho" da barra (que tem largura total), não a barra em si (que começa com largura 0)
    const alvos = new Map();
    barras.forEach(barra => alvos.set(barra.parentElement || barra, barra));

    const observador = new IntersectionObserver((entradas, obs) => {
        entradas.forEach(entrada => {
            if (!entrada.isIntersecting) return;
            preencher(alvos.get(entrada.target));
            obs.unobserve(entrada.target); // anima só uma vez
        });
    }, { threshold: 0.6 });

    alvos.forEach((barra, alvo) => observador.observe(alvo));
};
