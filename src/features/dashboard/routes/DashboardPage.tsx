import { Link } from 'react-router-dom'
import { useYouths } from '../../youth/context/useYouths'
import styles from './DashboardPage.module.css'

const DashboardPage: React.FC = () => {
  const { youths, access, isLoading, error } = useYouths()
  const activeYouth = youths.filter(({ status }) => status === 'active')
  const inactiveYouth = youths.length - activeYouth.length
  const recentYouth = youths.slice(0, 3)
  const directoryAvailable = access?.canManage === true && !error
  const metricValue = (value: number): string =>
    isLoading || !directoryAvailable ? '–' : String(value)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Visão geral</h1>
          <p>Acompanhe a comunidade e os acessos em um só lugar.</p>
        </div>
        <Link className={styles.primaryAction} to="/jovens">
          Ver jovens
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="m7 4 6 6-6 6" />
          </svg>
        </Link>
      </header>

      <section className={styles.metrics} aria-label="Resumo do diretório">
        <article>
          <span>Total de jovens</span>
          <strong>{metricValue(youths.length)}</strong>
          <small>{error ? 'dados indisponíveis' : 'cadastros no diretório'}</small>
        </article>
        <article>
          <span>Ativos</span>
          <strong>{metricValue(activeYouth.length)}</strong>
          <small>participando atualmente</small>
        </article>
        <article>
          <span>Inativos</span>
          <strong>{metricValue(inactiveYouth)}</strong>
          <small>precisam de acompanhamento</small>
        </article>
      </section>

      <div className={styles.columns}>
        <section className={styles.recent} aria-labelledby="recent-title">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="recent-title">Adicionados recentemente</h2>
              <p>
                {isLoading
                  ? 'Atualizando o diretório...'
                  : error
                    ? 'Não foi possível atualizar agora.'
                    : 'Últimos cadastros do diretório.'}
              </p>
            </div>
            <Link to="/jovens">Ver todos</Link>
          </div>

          <ul data-empty={recentYouth.length === 0}>
            {recentYouth.map((person) => (
              <li key={person.id}>
                <span className={styles.personAvatar} aria-hidden="true">
                  {person.photoUrl ? <img src={person.photoUrl} alt="" /> : person.initials}
                </span>
                <span className={styles.personName}>
                  <strong>{person.preferredName}</strong>
                  <small>{person.fullName}</small>
                </span>
                <span className={styles.personStatus} data-active={person.status === 'active'}>
                  {person.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </li>
            ))}
            {!isLoading && recentYouth.length === 0 && (
              <li className={styles.emptyRecent}>
                {directoryAvailable
                  ? 'Nenhum jovem foi adicionado ainda.'
                  : 'Ative um acesso de liderança para visualizar o diretório.'}
              </li>
            )}
          </ul>
        </section>

        <aside className={styles.access} aria-labelledby="access-title">
          <div className={styles.accessMark} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <h2 id="access-title">Acessos sob seu controle</h2>
            <p>
              Novas contas entram como membros pendentes. Só um administrador
              pode aprovar ou alterar cargos.
            </p>
          </div>
          <Link to="/acessos">
            Gerenciar acessos
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6 14 14 6M8 6h6v6" />
            </svg>
          </Link>
        </aside>
      </div>
    </div>
  )
}

export default DashboardPage
