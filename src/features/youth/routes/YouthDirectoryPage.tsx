import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import CommunityMark from '../../../components/CommunityMark'
import { mockYouth } from '../data/mockYouth'
import type { YouthStatus } from '../types/youth'
import styles from './YouthDirectoryPage.module.css'

type StatusFilter = 'all' | YouthStatus

const filterLabels: Record<StatusFilter, string> = {
  all: 'Todos',
  active: 'Ativos',
  inactive: 'Inativos',
}

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const YouthDirectoryPage: React.FC = () => {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const reduceMotion = useReducedMotion()

  const filteredYouth = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim())

    return mockYouth.filter((person) => {
      const matchesStatus = status === 'all' || person.status === status
      const searchableName = normalizeText(
        `${person.fullName} ${person.preferredName}`,
      )

      return matchesStatus && searchableName.includes(normalizedQuery)
    })
  }, [query, status])

  const activeCount = mockYouth.filter(
    (person) => person.status === 'active',
  ).length

  return (
    <main className={styles.page}>
      <section className={styles.intro} aria-labelledby="directory-title">
        <header className={styles.topbar}>
          <a className={styles.brand} href="/jovens" aria-label="Jovens, início">
            <CommunityMark className={styles.mark} />
            <span>Jovens</span>
          </a>
          <button className={styles.profileButton} type="button" disabled>
            AF
            <span className={styles.srOnly}>Perfil administrativo em breve</span>
          </button>
        </header>

        <div className={styles.introCopy}>
          <p className={styles.context}>Diretório da comunidade</p>
          <h1 id="directory-title">Quem caminha com a gente.</h1>
          <p className={styles.summary}>
            <strong>{activeCount}</strong> ativos nesta demonstração
          </p>
        </div>

        <div className={styles.searchShell}>
          <label htmlFor="youth-search">Buscar jovem</label>
          <div className={styles.searchField}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m15.5 15.5 5 5" />
            </svg>
            <input
              id="youth-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome ou apelido"
              autoComplete="off"
            />
          </div>
        </div>
      </section>

      <section className={styles.directory} aria-label="Lista de jovens">
        <div className={styles.filterRow}>
          <div className={styles.filters} aria-label="Filtrar por situação">
            {(Object.keys(filterLabels) as StatusFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                className={status === filter ? styles.activeFilter : undefined}
                aria-pressed={status === filter}
                onClick={() => setStatus(filter)}
              >
                {filterLabels[filter]}
              </button>
            ))}
          </div>
          <span className={styles.resultCount} aria-live="polite">
            {filteredYouth.length}{' '}
            {filteredYouth.length === 1 ? 'pessoa' : 'pessoas'}
          </span>
        </div>

        <motion.ul className={styles.people} layout={!reduceMotion}>
          <AnimatePresence initial={false} mode="popLayout">
            {filteredYouth.map((person) => (
              <motion.li
                key={person.id}
                layout={!reduceMotion}
                initial={false}
                exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <div
                  className={`${styles.portrait} ${styles[person.portraitTone]}`}
                  aria-hidden="true"
                >
                  {person.initials}
                </div>
                <div className={styles.personCopy}>
                  <div className={styles.nameLine}>
                    <h2>{person.preferredName}</h2>
                    <span>{person.age} anos</span>
                  </div>
                  <p>{person.fullName}</p>
                  <a href={`tel:${person.phone.replace(/\D/g, '')}`}>
                    {person.phone}
                  </a>
                </div>
                <span
                  className={
                    person.status === 'active'
                      ? styles.statusActive
                      : styles.statusInactive
                  }
                >
                  {person.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        {filteredYouth.length === 0 && (
          <div className={styles.emptyState}>
            <p>Ninguém encontrado.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setStatus('all')
              }}
            >
              Limpar busca
            </button>
          </div>
        )}

        <button className={styles.addButton} type="button" disabled>
          <span aria-hidden="true">+</span>
          Novo cadastro
          <small>Disponível após conectar o banco</small>
        </button>
      </section>
    </main>
  )
}

export default YouthDirectoryPage
