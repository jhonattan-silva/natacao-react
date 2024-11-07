import RedesSociais from '../RedesSociais/RedesSociais';
import style from './Rodape.module.css';

const Rodape = () => {
    return(
        <footer className={style.rodape}>
            <p>Respeitar as limitações técnicas da criança e prepará-la gradualmente para as provas. Utilizar a progressão das provas e métodos didáticos para motivar e superar dificuldades. Fazer da natação competitiva uma ferramenta de inclusão saudável no esporte. Criar eventos com base em processos pedagógicos que promovam um início positivo e educativo na modalidade. Unir e direcionar os profissionais responsáveis pela introdução das crianças no esporte.</p>
            <p><h3>Desenvolvido por: Jhonattan Silva</h3>
            <h4>Todos os direitos reservados 2024</h4></p>
            <RedesSociais />
        </footer>
    )
}

export default Rodape;