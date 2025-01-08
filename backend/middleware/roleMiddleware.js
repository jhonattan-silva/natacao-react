/* Recebe uma lista de perfis permitidos (requiredRoles).
Verifica se o usuário tem ao menos um dos perfis exigidos.
Retorna 403 Forbidden se o acesso não for permitido. */
const perfilMiddleware = (requiredRoles) => (req, res, next) => {
    const { perfis } = req.user; // Perfis vêm do token JWT

    // Verifica se o usuário possui algum dos perfis exigidos
    const hasRole = perfis.some((perfil) => requiredRoles.includes(perfil));
    if (!hasRole) {
        return res.status(403).json({ message: 'Acesso negado.' });
    }

    next();
};

module.exports = perfilMiddleware;
