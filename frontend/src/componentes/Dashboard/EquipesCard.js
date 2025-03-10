import style from './Dashboard.module.css';

const EquipesCard = ({ dados }) => {
    return (
        <div className={style.card}>
            <h3>🏊 Equipes</h3>
            <p>Total de Equipes: <strong>{dados?.total || 'Carregando...'}</strong></p>
            <p>Total de Atletas Inscritos: {dados?.atletas || 0}</p>
        </div>
    );
};

export default EquipesCard;
