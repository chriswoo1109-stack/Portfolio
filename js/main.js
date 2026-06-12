'use strict'

const API = 'http://localhost:8080/api'

/* ===========================
   GSAP 플러그인 등록
=========================== */
gsap.registerPlugin(ScrollToPlugin)


/* ===========================
   헤더 스크롤 처리
=========================== */
const headerEl = document.getElementById('header')
const toTopEl  = document.getElementById('to-top')

window.addEventListener('scroll', _.throttle(function () {
  headerEl.classList.toggle('scrolled', window.scrollY > 60)

  if (window.scrollY > 600) {
    toTopEl.style.opacity    = '1'
    toTopEl.style.visibility = 'visible'
  } else {
    toTopEl.style.opacity    = '0'
    toTopEl.style.visibility = 'hidden'
  }
}, 150))

toTopEl.addEventListener('click', function () {
  gsap.to(window, { duration: 0.8, scrollTo: 0, ease: 'power2.inOut' })
})


/* ===========================
   네비 활성화
=========================== */
const sections = document.querySelectorAll('section[id]')
const navLinks = document.querySelectorAll('#header .nav a')

window.addEventListener('scroll', _.throttle(function () {
  const pos = window.scrollY + 120
  sections.forEach(function (sec) {
    const top = sec.offsetTop
    const id  = sec.getAttribute('id')
    if (pos >= top && pos < top + sec.offsetHeight) {
      navLinks.forEach(l => l.classList.remove('active'))
      const active = document.querySelector(`#header .nav a[href="#${id}"]`)
      if (active) active.classList.add('active')
    }
  })
}, 100))


/* ===========================
   부드러운 스크롤
=========================== */
document.querySelectorAll('a[href^="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    const target = document.querySelector(a.getAttribute('href'))
    if (!target) return
    e.preventDefault()
    gsap.to(window, { duration: 0.8, scrollTo: { y: target, offsetY: 72 }, ease: 'power2.inOut' })
  })
})


/* ===========================
   히어로 페이드인
=========================== */
document.querySelectorAll('.hero .fade-in').forEach(function (el, i) {
  gsap.to(el, { duration: 0.9, delay: 0.2 + i * 0.25, opacity: 1, y: 0, ease: 'power2.out' })
})


/* ===========================
   플로팅 요소
=========================== */
function rnd(min, max) { return parseFloat((Math.random() * (max - min) + min).toFixed(2)) }
function floating(sel, delay, dist) {
  gsap.to(sel, { duration: rnd(2, 3.5), delay: rnd(0, delay), y: dist, repeat: -1, yoyo: true, ease: 'power1.inOut' })
}
floating('.floating-1', 0.5, 20)
floating('.floating-2', 1.0, 15)
floating('.floating-3', 1.5, 25)


/* ===========================
   GitHub 레포지토리 → Projects 섹션
   Spring MVC의 RestTemplate이 GitHub API를 호출해 데이터를 반환
=========================== */
let projectSwiper = null

const LANG_ICON  = {
  Java: '☕', JavaScript: '⚡', TypeScript: '⚡',
  Python: '🐍', HTML: '🌐', CSS: '🌐',
  Shell: '🖥️', C: '⚙️', 'C++': '⚙️',
  Go: '🔷', Rust: '🦀', Ruby: '💎', Kotlin: '🎯'
}
const LANG_COVER = {
  Java: 'cover--1', JavaScript: 'cover--2', TypeScript: 'cover--2',
  Python: 'cover--3', HTML: 'cover--4', CSS: 'cover--4',
  Go: 'cover--1', Rust: 'cover--3', Ruby: 'cover--4', Kotlin: 'cover--1'
}
const LANG_TAG = {
  Java: 'backend', JavaScript: 'frontend', TypeScript: 'frontend',
  Python: 'lang', HTML: 'frontend', CSS: 'frontend',
  Go: 'backend', Rust: 'lang', Shell: 'lang', C: 'lang', 'C++': 'lang'
}

async function loadGithubProjects() {
  try {
    const res = await fetch(`${API}/github/repos`)
    if (!res.ok) throw new Error(res.status)
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    renderGithubRepos(data)
  } catch (e) {
    console.warn('백엔드 연결 실패 - GitHub API 직접 호출:', e.message)
    try {
      await loadGithubDirect()
    } catch (e2) {
      console.warn('GitHub API 직접 호출도 실패 - 정적 데이터 사용:', e2.message)
      initSwiper()
    }
  }
}

async function loadGithubDirect() {
  const res = await fetch('https://api.github.com/users/chriswoo1109-stack/repos?sort=updated&per_page=20', {
    headers: { 'Accept': 'application/vnd.github+json' }
  })
  if (!res.ok) throw new Error(res.status)
  const repos = await res.json()
  const mapped = repos
    .filter(function (r) { return !r.fork })
    .slice(0, 12)
    .map(function (r) {
      return {
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        url: r.html_url,
        homepage: r.homepage,
        topics: r.topics || [],
        updatedAt: r.updated_at
      }
    })
  renderGithubRepos(mapped)
}

function renderGithubRepos(repos) {
  const wrapper = document.querySelector('.projects-swiper .swiper-wrapper')
  if (!wrapper || repos.length === 0) { initSwiper(); return }

  wrapper.innerHTML = repos.map(function (r, i) {
    const lang       = r.language || ''
    const icon       = LANG_ICON[lang] || '📁'
    const coverClass = r.name === 'Starbucks' ? 'cover--starbucks' : r.name === 'Overwatch' ? 'cover--overwatch' : (LANG_COVER[lang] || ('cover--' + ((i % 4) + 1)))
    const tagType    = LANG_TAG[lang]   || 'security'
    const topics     = Array.isArray(r.topics) ? r.topics : []
    const stars      = r.stars || 0

    const extraTags = r.name === 'Starbucks' ? ['CSS', 'JS'] : r.name === 'Overwatch' ? ['CSS'] : []
    const allTags  = [lang].concat(topics).concat(extraTags).filter(Boolean).slice(0, 4)
    const tagsHTML = allTags.map(function (t) {
      return '<span class="tag tag--' + tagType + '">' + t + '</span>'
    }).join('')

    const desc    = r.description || '설명이 없습니다.'
    const demoUrl = r.homepage || ''
    const ghUrl   = r.url || '#'
    const title   = r.name.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase() })

    return `
      <div class="swiper-slide">
        <div class="project-card" data-repo="${r.name}" style="cursor:pointer;">
          <div class="project-card__cover ${coverClass}">
            <div class="cover-label">${lang || 'Code'}</div>
            <div class="cover-icon">${icon}</div>
            ${stars > 0 ? `<div class="cover-stars">★ ${stars}</div>` : ''}
          </div>
          <div class="project-card__body">
            <div class="project-card__tags">${tagsHTML}</div>
            <h3>${title}</h3>
            <p>${desc}</p>
            <div class="project-card__links">
              <a href="${ghUrl}" target="_blank" rel="noopener" class="btn btn--sm btn--outline" onclick="event.stopPropagation()">GitHub</a>
              ${demoUrl ? `<a href="${demoUrl}" target="_blank" rel="noopener" class="btn btn--sm btn--accent" onclick="event.stopPropagation()">Demo</a>` : ''}
            </div>
          </div>
        </div>
      </div>`
  }).join('')

  initSwiper()
}


/* ===========================
   레포 상세 모달 (백엔드 /api/github/repos/{name})
=========================== */
const modalOverlay = document.getElementById('project-modal')
const modalClose   = document.getElementById('modal-close')

modalClose.addEventListener('click', closeModal)
modalOverlay.addEventListener('click', function (e) {
  if (e.target === modalOverlay) closeModal()
})
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal()
})

function closeModal() {
  modalOverlay.classList.remove('open')
}

async function openRepoModal(repoName) {
  modalOverlay.classList.add('open')

  // 로딩 상태
  document.getElementById('modal-title').textContent = '불러오는 중...'
  document.getElementById('modal-desc').textContent  = ''
  document.getElementById('modal-stars').textContent = ''
  document.getElementById('modal-updated').textContent = ''
  document.getElementById('modal-lang-badge').textContent = ''
  document.getElementById('modal-topics').innerHTML  = ''
  document.getElementById('modal-cover-icon').textContent = '⏳'
  document.getElementById('modal-cover-lang').textContent = ''

  try {
    const res = await fetch(`${API}/github/repos/${repoName}`)
    if (!res.ok) throw new Error(res.status)
    const r = await res.json()

    const lang = r.language || ''
    const icon = LANG_ICON[lang] || '📁'
    const title = r.name.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase() })
    const topics = Array.isArray(r.topics) ? r.topics : []
    const date = r.updatedAt ? r.updatedAt.substring(0, 10) : ''

    document.getElementById('modal-cover-icon').textContent = icon
    document.getElementById('modal-cover-lang').textContent = lang || 'Code'
    document.getElementById('modal-cover').className = 'modal-cover ' + (LANG_COVER[lang] || 'cover--1')

    document.getElementById('modal-title').textContent = title
    document.getElementById('modal-desc').textContent  = r.description || '설명이 없습니다.'
    document.getElementById('modal-stars').textContent = `★ ${r.stars || 0}`
    document.getElementById('modal-updated').textContent = date ? `마지막 업데이트: ${date}` : ''
    document.getElementById('modal-lang-badge').textContent = lang || ''

    document.getElementById('modal-topics').innerHTML = topics.map(function (t) {
      return `<span class="modal-topic-tag">${t}</span>`
    }).join('')

    const readmeWrap = document.getElementById('modal-readme-wrap')
    const readmeEl   = document.getElementById('modal-readme')
    if (r.readme) {
      readmeEl.textContent  = r.readme
      readmeWrap.style.display = ''
    } else {
      readmeWrap.style.display = 'none'
    }

    const ghLink = document.getElementById('modal-gh-link')
    ghLink.href = r.url || '#'

    const demoLink = document.getElementById('modal-demo-link')
    if (r.homepage) {
      demoLink.href = r.homepage
      demoLink.style.display = ''
    } else {
      demoLink.style.display = 'none'
    }
  } catch (e) {
    document.getElementById('modal-title').textContent = '불러오기 실패'
    document.getElementById('modal-desc').textContent  = '백엔드 서버에 연결할 수 없습니다.'
  }
}

function initSwiper() {
  if (projectSwiper) { projectSwiper.destroy(true, true) }
  projectSwiper = new Swiper('.projects-swiper', {
    loop: true,
    slidesPerView: 1.6,
    centeredSlides: true,
    spaceBetween: 28,
    autoplay: { delay: 4000, disableOnInteraction: false },
    pagination: { el: '.projects-pagination', clickable: true },
    navigation: { prevEl: '.projects-prev', nextEl: '.projects-next' },
    on: {
      click: function (swiper, event) {
        const card = event.target.closest('.project-card[data-repo]')
        if (card) openRepoModal(card.dataset.repo)
      }
    }
  })
}


/* ===========================
   ScrollMagic (스크롤 스파이)
=========================== */
function initScrollMagic() {
  const controller = new ScrollMagic.Controller()

  document.querySelectorAll('section.scroll-spy').forEach(function (section) {
    new ScrollMagic.Scene({ triggerElement: section, triggerHook: 0.82 })
      .setClassToggle(section, 'show')
      .on('enter', function () {
        if (section.id === 'skills') {
          setTimeout(function () {
            section.querySelectorAll('.skill-bar__fill').forEach(function (bar) {
              gsap.to(bar, { duration: 1.4, width: bar.dataset.width + '%', ease: 'power2.out' })
            })
          }, 500)
        }
      })
      .addTo(controller)
  })
}


/* ===========================
   GitHub 요약 (백엔드 /api/github/summary)
=========================== */
async function loadGithubSummary() {
  const loading = document.getElementById('github-loading')
  const error   = document.getElementById('github-error')
  const content = document.getElementById('github-content')

  try {
    const res = await fetch(`${API}/github/summary`)
    if (!res.ok) throw new Error(res.status)
    const data = await res.json()
    if (data.error) throw new Error(data.error)

    // 통계 수치
    document.getElementById('gh-total-repos').textContent = data.totalRepos
    document.getElementById('gh-total-stars').textContent = data.totalStars

    const langs = Object.keys(data.languageCount)
    document.getElementById('gh-top-lang').textContent = langs[0] || '-'

    // 언어 분포 바
    const langEl  = document.getElementById('gh-languages')
    const total   = Object.values(data.languageCount).reduce((a, b) => a + b, 0)
    langEl.innerHTML = langs.slice(0, 6).map(function (lang) {
      const count = data.languageCount[lang]
      const pct   = Math.round((count / total) * 100)
      return `
        <div class="lang-bar-item">
          <div class="lang-bar-label">
            <span>${lang}</span>
            <span>${count}개 (${pct}%)</span>
          </div>
          <div class="lang-bar-track">
            <div class="lang-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>`
    }).join('')

    // Top 레포
    document.getElementById('gh-top-repos').innerHTML =
      data.topRepos.map(function (r) {
        return `
          <li>
            <a href="${r.url}" target="_blank" rel="noopener">
              <span class="repo-name">${r.name}</span>
              <span class="repo-desc">${r.description || '설명 없음'}</span>
              <span class="repo-meta">
                <span>★ ${r.stars}</span>
                ${r.language ? `<span>${r.language}</span>` : ''}
              </span>
            </a>
          </li>`
      }).join('')

    // 최근 레포
    document.getElementById('gh-recent-repos').innerHTML =
      data.recentRepos.map(function (r) {
        const date = r.updatedAt ? r.updatedAt.substring(0, 10) : ''
        return `
          <li>
            <a href="${r.url}" target="_blank" rel="noopener">
              <span class="repo-name">${r.name}</span>
              <span class="repo-desc">${r.description || '설명 없음'}</span>
              <span class="repo-meta">
                <span>${date}</span>
                ${r.language ? `<span>${r.language}</span>` : ''}
              </span>
            </a>
          </li>`
      }).join('')

    loading.style.display = 'none'
    content.style.display = 'block'

  } catch (e) {
    console.warn('GitHub 요약 로드 실패:', e.message)
    loading.style.display = 'none'
    error.style.display   = 'block'
  }
}


/* ===========================
   연도 & 초기화
=========================== */
document.querySelector('.this-year').textContent = new Date().getFullYear()

loadGithubProjects().then(function () { setTimeout(initScrollMagic, 100) })
loadGithubSummary()
