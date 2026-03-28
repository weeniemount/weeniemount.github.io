function renderFriend(f) {
    return `
        <a href="${f.link}" class="friendcard" target="_blank" rel="noopener">
            <img src="${f.picture}" alt="${f.name}">
            <div class="friendinfo">
                <h2>${f.name}</h2>
                <p>${f.description}</p>
            </div>
        </a>
    `;
}

function initPage() {
    if (location.pathname.includes('projects')) {
        const content = document.querySelector('.content');
        if (!content) return;
        fetch('/json/projects.json')
            .then(r => r.json())
            .then(({ categories, projects }) => {
                for (const category of categories) {
                    const categoryProjects = projects.filter(p => p.category === category.id);
                    if (categoryProjects.length === 0) continue;
                    const h1 = document.createElement('h1');
                    h1.textContent = category.label;
                    content.appendChild(h1);
                    const list = document.createElement('div');
                    list.className = 'appslist';
                    list.innerHTML = categoryProjects.map(renderProject).join('');
                    content.appendChild(list);
                }
            })
            .catch(err => console.error('failed to load projects.json:', err));
    }

    if (location.pathname.includes('friends')) {
        const content = document.querySelector('.content');
        if (!content) return;
        fetch('/json/friends.json')
            .then(r => r.json())
            .then(({ friends }) => {
                const shuffled = friends.slice().sort(() => Math.random() - 0.5);
                const h1 = document.createElement('h1');
                h1.textContent = 'friends';
                content.appendChild(h1);

                const subtitle = document.createElement('p');
                subtitle.textContent = 'shown in a random order';
                subtitle.style.opacity = '0.5';
                subtitle.style.textAlign = 'center';
                subtitle.style.marginTop = '-8px';
                content.appendChild(subtitle);
                const list = document.createElement('div');
                list.className = 'friendslist';
                list.innerHTML = shuffled.map(renderFriend).join('');
                content.appendChild(list);

                list.querySelectorAll('.friendcard').forEach((card, i) => {
                    card.style.animationDelay = `${i * 0.08}s`;
                });

                requestAnimationFrame(() => {
                    list.querySelectorAll('.description-clip').forEach(clip => {
                        const p = clip.querySelector('p');
                        const overflow = p.scrollHeight - clip.clientHeight;
                        if (overflow > 0) {
                            p.style.setProperty('--scroll-amount', `-${overflow}px`);
                            p.style.transition = 'transform 0.4s ease 0.2s';
                        }
                    });
                });
            })
            .catch(err => console.error('failed to load friends.json:', err));
    }
}

function renderProject(p) {
    return `
        <a href="${p.href}">
            <div class="appcontainer">
                <img src="${p.img}"${p.imgStyle ? ` style="${p.imgStyle}"` : ''} class="appimage">
                <div class="apppopup">
                    <div class="arrow"></div>
                    <h2>${p.name}</h2>
                    <p class="platforms">${p.platforms}</p>
                    <p class="description">${p.description}</p>
                </div>
            </div>
        </a>
    `;
}

function swapContent(html, href) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const content = document.querySelector('.content');
    const newContent = doc.querySelector('.content');

    content.style.opacity = '0';
    setTimeout(() => {
        content.innerHTML = newContent.innerHTML;
        content.className = newContent.className;
        if (href) history.pushState(null, '', href);
        content.style.opacity = '1';
        initPage();
    }, 150);
}

document.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;
    if (!href.endsWith('.html') && !href.match(/\/[^/.]*$/)) return;

    const fetchUrl = href === '/' ? '/index.html' : href.endsWith('.html') ? href : href + '.html';
    e.preventDefault();
    fetch(fetchUrl).then(r => r.text()).then(html => swapContent(html, href));
});

window.addEventListener('popstate', () => {
    const pathname = location.pathname;
    const fetchUrl = pathname === '/' ? '/index.html' : pathname.endsWith('.html') ? pathname : pathname + '.html';
    fetch(fetchUrl).then(r => r.text()).then(html => swapContent(html, null));
});

window.addEventListener('popstate', () => {
    fetch(location.pathname).then(r => r.text()).then(html => swapContent(html, null));
});

initPage();