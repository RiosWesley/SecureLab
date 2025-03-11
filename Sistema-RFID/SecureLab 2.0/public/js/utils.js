/**
 * Utilitários para manipulação segura de elementos DOM
 */

// Função para verificar se um elemento existe antes de acessá-lo
function safeDOM(id, callback) {
    const element = document.getElementById(id);
    if (element && callback) {
        callback(element);
    }
    return element;
}

// Função para definir o conteúdo de texto de um elemento com segurança
function safeTextContent(id, text) {
    safeDOM(id, element => {
        element.textContent = text;
    });
}

// Função para definir o HTML interno de um elemento com segurança
function safeInnerHTML(id, html) {
    safeDOM(id, element => {
        element.innerHTML = html;
    });
}

// Função para definir o valor de um elemento com segurança
function safeValue(id, value) {
    safeDOM(id, element => {
        element.value = value;
    });
}

// Função para definir um atributo de um elemento com segurança
function safeSetAttribute(id, attribute, value) {
    safeDOM(id, element => {
        element.setAttribute(attribute, value);
    });
}

// Função para definir o estilo de um elemento com segurança
function safeStyle(id, property, value) {
    safeDOM(id, element => {
        element.style[property] = value;
    });
}

// Função para adicionar uma classe a um elemento com segurança
function safeAddClass(id, className) {
    safeDOM(id, element => {
        element.classList.add(className);
    });
}

// Função para remover uma classe de um elemento com segurança
function safeRemoveClass(id, className) {
    safeDOM(id, element => {
        element.classList.remove(className);
    });
}

// Função para verificar a página atual
function getCurrentPage() {
    const path = window.location.pathname;
    const pageName = path.split('/').pop().split('.')[0];
    return pageName || 'index';
}

// Função para verificar se estamos em uma página específica
function isPage(pageName) {
    return getCurrentPage() === pageName;
}