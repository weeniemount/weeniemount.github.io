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

function doExternalLinkAnimation(link, href) {
    const visualEl = link.classList.contains('friendcard')
        ? link
        : (link.querySelector('.appcontainer') || link);

    const rect = visualEl.getBoundingClientRect();

    const front = document.createElement('div');
    front.style.cssText = `
        position: absolute;
        inset: 0;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
    `;

    const back = document.createElement('div');
    back.style.cssText = `
        position: absolute;
        inset: 0;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        transform: rotateY(180deg);
        background-color: #1a1a1a;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    `;

    const inner = document.createElement('div');
    inner.style.cssText = `
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        position: relative;
        transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    inner.appendChild(front);
    inner.appendChild(back);

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: absolute;
        transform-style: preserve-3d;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        transition:
            top 0.7s cubic-bezier(0.4, 0, 0.2, 1),
            left 0.7s cubic-bezier(0.4, 0, 0.2, 1),
            width 0.7s cubic-bezier(0.4, 0, 0.2, 1),
            height 0.7s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    overlay.appendChild(inner);

    const perspectiveContainer = document.createElement('div');
    perspectiveContainer.style.cssText = `
        position: fixed;
        z-index: 9999;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        perspective: 1000px;
        pointer-events: none;
    `;
    perspectiveContainer.appendChild(overlay);

    html2canvas(visualEl, { backgroundColor: null, useCORS: true }).then(canvas => {
        const img = document.createElement('img');
        img.src = canvas.toDataURL();
        img.style.cssText = 'width: 100%; height: 100%; object-fit: fill; display: block; border-radius: inherit;';
        front.appendChild(img);

        const backImg = document.createElement('img');
        backImg.src = canvas.toDataURL();
        backImg.style.cssText = `
            width: ${rect.width}px;
            height: ${rect.height}px;
            display: block;
            border-radius: inherit;
        `;
        back.appendChild(backImg);

        visualEl.style.visibility = 'hidden';
        document.body.appendChild(perspectiveContainer);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100vw';
                overlay.style.height = '100vh';
                inner.style.transform = 'rotateY(180deg)';
            });
        });
    });

    setTimeout(() => {
        window.location.href = href;
    }, 750);
}

document.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;

    if (href.startsWith('http')) {
        e.preventDefault();
        doExternalLinkAnimation(link, href);
        return;
    }

    if (href.startsWith('#')) return;
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

initPage();