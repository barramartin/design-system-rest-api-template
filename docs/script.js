document.addEventListener('DOMContentLoaded', () => {
  // Dom elemek
  const themeSwitcherLight = document.getElementById('theme-light');
  const themeSwitcherDark = document.getElementById('theme-dark');
  const searchInput = document.getElementById('token-search');
  const categoryItems = document.querySelectorAll('.category-item');
  const tokenGroupsContainer = document.querySelector('.token-groups');

  // A teljes CSS változók listája
  let allTokens = [];
  // A kategóriák listája
  let categories = new Set();
  // Aktív kategória
  let activeCategory = 'all';

  // ------------------
  // Témaváltás
  // ------------------
  
  themeSwitcherLight.addEventListener('click', () => {
    document.body.classList.remove('dark-theme');
    themeSwitcherLight.classList.add('active');
    themeSwitcherDark.classList.remove('active');
  });
  
  themeSwitcherDark.addEventListener('click', () => {
    document.body.classList.add('dark-theme');
    themeSwitcherDark.classList.add('active');
    themeSwitcherLight.classList.remove('active');
  });

  // ------------------
  // CSS változók beolvasása
  // ------------------
  
  function getCssVariables() {
    // A linkelt stílusokat olvassuk be
    const styleSheets = Array.from(document.styleSheets);
    
    styleSheets.forEach(sheet => {
      try {
        // Csak a variables.css fájlt nézzük
        if (sheet.href && sheet.href.includes('variables.css')) {
          const cssRules = Array.from(sheet.cssRules);
          
          cssRules.forEach(rule => {
            // A :root szelektort keressük
            if (rule.selectorText === ':root') {
              for (let i = 0; i < rule.style.length; i++) {
                const property = rule.style[i];
                const value = rule.style.getPropertyValue(property);
                
                if (property.startsWith('--')) {
                  // Kategória kinyerése a változó nevéből
                  const nameParts = property.substring(2).split('-');
                  let category = 'other';
                  
                  // Próbáljuk kitalálni a kategóriát a változó nevéből
                  if (property.includes('color') || property.includes('background') || 
                      property.includes('border') || property.includes('shadow')) {
                    category = 'color';
                  } else if (property.includes('spacing') || property.includes('gap') || 
                           property.includes('margin') || property.includes('padding')) {
                    category = 'spacing';
                  } else if (property.includes('font') || property.includes('text') || 
                           property.includes('line-height')) {
                    category = 'typography';
                  } else if (property.includes('radius') || property.includes('border')) {
                    category = 'border';
                  } else if (property.includes('shadow') || property.includes('elevation')) {
                    category = 'effect';
                  }
                  
                  categories.add(category);
                  
                  // Létrehozzuk a token objektumot
                  const token = {
                    name: property,
                    value: value,
                    category: category,
                    isColor: isColorValue(value)
                  };
                  
                  allTokens.push(token);
                }
              }
            }
          });
        }
      } catch (e) {
        console.error('Hiba a stílusok olvasásakor:', e);
      }
    });
    
    // Kategóriák feltöltése
    renderCategories();
    
    // Tokenek megjelenítése
    renderTokens(allTokens);
  }
  
  // ------------------
  // Segédfüggvények
  // ------------------
  
  // Megvizsgálja, hogy egy érték szín-e
  function isColorValue(value) {
    return value.includes('#') || 
           value.includes('rgb') || 
           value.includes('hsl') || 
           (value.includes('var(--') && 
            (value.includes('color') || value.includes('background') || value.includes('border')));
  }
  
  // Csoportosítja a tokeneket prefix alapján
  function groupTokensByPrefix(tokens) {
    const groups = {};
    
    tokens.forEach(token => {
      // Az első kötőjel utáni részig nézzük a prefixet
      const parts = token.name.substring(2).split('-');
      const prefix = parts[0];
      
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      
      groups[prefix].push(token);
    });
    
    return groups;
  }

  // ------------------
  // Megjelenítő függvények
  // ------------------
  
  // Kategóriák megjelenítése
  function renderCategories() {
    const categoriesContainer = document.querySelector('.filter-categories');
    categoriesContainer.innerHTML = '<h3>Kategóriák</h3>';
    
    // Mindig legyen "összes" kategória
    const allCategoryItem = document.createElement('div');
    allCategoryItem.classList.add('category-item', 'active');
    allCategoryItem.textContent = 'Összes';
    allCategoryItem.dataset.category = 'all';
    categoriesContainer.appendChild(allCategoryItem);
    
    // A többi kategória
    Array.from(categories).sort().forEach(category => {
      const categoryItem = document.createElement('div');
      categoryItem.classList.add('category-item');
      categoryItem.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      categoryItem.dataset.category = category;
      categoriesContainer.appendChild(categoryItem);
    });
    
    // Kategória kattintás eseményfigyelő
    document.querySelectorAll('.category-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        
        activeCategory = item.dataset.category;
        filterTokens();
      });
    });
  }
  
  // Tokenek megjelenítése
  function renderTokens(tokens) {
    tokenGroupsContainer.innerHTML = '';
    
    // Csoportosítás
    const groups = groupTokensByPrefix(tokens);
    
    // Minden csoport megjelenítése
    Object.keys(groups).sort().forEach(groupName => {
      const groupTokens = groups[groupName];
      
      const tokenGroup = document.createElement('div');
      tokenGroup.classList.add('token-group');
      
      const tokenGroupHeader = document.createElement('div');
      tokenGroupHeader.classList.add('token-group-header');
      tokenGroupHeader.textContent = groupName.charAt(0).toUpperCase() + groupName.slice(1);
      
      const tokenList = document.createElement('div');
      tokenList.classList.add('token-list');
      
      // A csoport tokenjei
      groupTokens.forEach(token => {
        const tokenItem = document.createElement('div');
        tokenItem.classList.add('token-item');
        
        // Szín előnézet, ha a token szín
        if (token.isColor) {
          const colorPreview = document.createElement('div');
          colorPreview.classList.add('token-color-preview');
          // Megpróbáljuk beállítani a színt, egyébként marad az alapértelmezett
          try {
            colorPreview.style.backgroundColor = token.value;
          } catch (e) {
            console.warn('Nem sikerült a szín beállítása:', token.value);
          }
          tokenItem.appendChild(colorPreview);
        }
        
        const tokenDetails = document.createElement('div');
        tokenDetails.classList.add('token-details');
        
        const tokenName = document.createElement('div');
        tokenName.classList.add('token-name');
        tokenName.textContent = token.name;
        
        const tokenValue = document.createElement('div');
        tokenValue.classList.add('token-value');
        tokenValue.textContent = token.value;
        
        tokenDetails.appendChild(tokenName);
        tokenDetails.appendChild(tokenValue);
        
        tokenItem.appendChild(tokenDetails);
        tokenList.appendChild(tokenItem);
      });
      
      tokenGroup.appendChild(tokenGroupHeader);
      tokenGroup.appendChild(tokenList);
      
      tokenGroupsContainer.appendChild(tokenGroup);
    });
  }
  
  // ------------------
  // Keresés és szűrés
  // ------------------
  
  // Szűrés keresés és kategória alapján
  function filterTokens() {
    const searchTerm = searchInput.value.toLowerCase();
    
    let filteredTokens = allTokens;
    
    // Kategória szerinti szűrés
    if (activeCategory !== 'all') {
      filteredTokens = filteredTokens.filter(token => token.category === activeCategory);
    }
    
    // Keresési kifejezés szerinti szűrés
    if (searchTerm) {
      filteredTokens = filteredTokens.filter(token => 
        token.name.toLowerCase().includes(searchTerm) || 
        token.value.toLowerCase().includes(searchTerm)
      );
    }
    
    renderTokens(filteredTokens);
  }
  
  // Keresőmező eseményfigyelő
  searchInput.addEventListener('input', filterTokens);
  
  // Kezdeti betöltés
  getCssVariables();
}); 