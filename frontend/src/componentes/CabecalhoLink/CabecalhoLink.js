import { Link, useLocation } from 'react-router-dom';
import style from './CabecalhoLink.module.css';

const CabecalhoLink = ({ url, children, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === url;

    return (
        <Link 
            to={url} 
            className={`${style.link} ${isActive ? style.active : ''}`}
            onClick={onClick}
        >
            {children}
        </Link>
    );
};

export default CabecalhoLink;