import React, { useState } from 'react';
import styles from './Abas.module.css';

/**
 * 
 *  @param {Array} tabs - Lista de abas 
 *  @param {String} tabs[].label - Título da aba
 *  @param {String} tabs[].content - Conteúdo da aba
 * 
 */
const Abas = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].label);

  return (
    <div className={styles.abasContainer}>
      {/* Menu de Abas */}
      <div className={styles.tabs}>
        {tabs.map((tab, index) => (
          <button 
            key={tab.label}
            onClick={() => setActiveTab(tab.label)} 
            className={`${activeTab === tab.label ? styles.active : ''} ${styles[`tab${index + 1}`]} ${styles.tabButton}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Conteúdo das Abas */}
      <div className={styles.tabContent}>
        {tabs.map((tab, index) => (
          <div key={tab.label} className={`${styles[`content${index + 1}`]} ${styles.tabContentItem}`} style={{ display: activeTab === tab.label ? 'block' : 'none' }}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Abas;
