/**
 * Melhorias para experiência em dispositivos móveis
 */

// Detectar tipo de dispositivo para otimizações
function isMobileDevice() {
    return window.innerWidth <= 768;
  }
  
  // Otimizar componentes baseado no tipo de dispositivo
  function optimizeForDevice() {
    const isMobile = isMobileDevice();
    
    // Ajustar automaticamente para dispositivos móveis
    if (isMobile) {
      // Fechar sidebar por padrão em dispositivos móveis
      document.querySelector('.app-container')?.classList.remove('sidebar-collapsed');
      localStorage.setItem('sidebarCollapsed', false);
      
      // Tornar tabelas mais responsivas
      adjustTablesForMobile();
    }
  }
  
  // Ajustar tabelas para melhor visualização móvel
  function adjustTablesForMobile() {
    const tables = document.querySelectorAll('.table');
    
    tables.forEach(table => {
      // Adicionar atributo para toques horizontais mais suaves
      table.parentElement.style.webkitOverflowScrolling = 'touch';
      
      // Opcional: Converter tabelas para formato de cards em telas muito pequenas
      if (window.innerWidth <= 480) {
        convertTableToCards(table);
      }
    });
  }
  
  // Converter tabelas para visualização tipo card em telas muito pequenas
  function convertTableToCards(table) {
    // Implementação opcional para transformar tabelas em cards em telas muito pequenas
    // Este é um exemplo conceitual que precisaria ser adaptado ao seu caso específico
    
    if (!table || window.innerWidth > 480) return;
    
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const rows = table.querySelectorAll('tbody tr');
    
    // Esconde o cabeçalho da tabela
    table.querySelector('thead').style.display = 'none';
    
    // Transforma cada linha em um "card"
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      
      // Adiciona atributos data para identificar conteúdo
      cells.forEach((cell, index) => {
        if (headers[index]) {
          cell.setAttribute('data-label', headers[index]);
          cell.style.display = 'flex';
          cell.style.justifyContent = 'space-between';
          cell.style.padding = '8px 5px';
          cell.innerHTML = `<span class="td-label">${headers[index]}:</span> <span class="td-content">${cell.innerHTML}</span>`;
        }
      });
      
      // Estiliza a linha como um card
      row.style.display = 'block';
      row.style.marginBottom = '10px';
      row.style.border = '1px solid #eee';
      row.style.borderRadius = '5px';
      row.style.padding = '10px 5px';
    });
  }
  
  // Registrar eventos para redimensionamento
  window.addEventListener('resize', () => {
    optimizeForDevice();
  });
  
  // Inicializar otimizações quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    optimizeForDevice();
  });